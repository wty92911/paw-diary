import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';
import { ActivityRecord, ActivityFormData } from '../lib/types/activities';

export type Activity = ActivityRecord;

// Activity query keys factory for consistent cache management
export const activityKeys = {
  all: ['activities'] as const,
  lists: () => [...activityKeys.all, 'list'] as const,
  list: (petId: number) => [...activityKeys.lists(), petId] as const,
  details: () => [...activityKeys.all, 'detail'] as const,
  detail: (id: number) => [...activityKeys.details(), id] as const,
} as const;

/**
 * Basic hook for fetching activities for a specific pet with optimized caching
 */
export function useActivities(petId: number) {
  console.log(`🎯 useActivities called with petId: ${petId}, enabled: ${!!petId}`);

  const query = useQuery<Activity[]>({
    queryKey: activityKeys.list(petId),
    queryFn: async () => {
      console.log(`🔍 Fetching activities for pet ${petId} from backend...`);
      const result = await invoke('get_activities_for_pet', { petId });
      const activities = result as Activity[];
      console.log(
        `📊 Backend returned ${activities.length} activities for pet ${petId}:`,
        activities,
      );
      return activities;
    },
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
    enabled: !!petId,
  });

  console.log(`📋 useActivities query state:`, {
    petId,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    dataLength: query.data?.length || 0,
    enabled: !!petId,
    status: query.status,
  });

  return query;
}

/**
 * Hook for fetching a single activity with caching
 */
export function useActivity(activityId: number) {
  return useQuery<Activity>({
    queryKey: activityKeys.detail(activityId),
    queryFn: async () => {
      const result = await invoke('get_activity', { activityId });
      return result as Activity;
    },
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
    enabled: !!activityId,
  });
}

/**
 * Mutation hook for creating activities with optimistic updates
 */
export function useCreateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { petId: number; activityData: ActivityFormData }) => {
      // Convert ActivityFormData to ActivityCreateRequest format expected by backend
      const result = await invoke('create_activity', {
        activityData: {
          pet_id: data.petId,
          category: data.activityData.category,
          subcategory: data.activityData.subcategory,
          activity_data: data.activityData.blocks,
        },
      });
      return result as Activity;
    },
    onMutate: async ({ petId, activityData }) => {
      await queryClient.cancelQueries({ queryKey: activityKeys.list(petId) });
      const previousActivities = queryClient.getQueryData<Activity[]>(activityKeys.list(petId));
      const tempId = Date.now();

      if (previousActivities) {
        const tempActivity: Activity = {
          id: tempId,
          pet_id: petId,
          category: activityData.category,
          subcategory: activityData.subcategory || '',
          activity_data: activityData.blocks || {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        queryClient.setQueryData<Activity[]>(activityKeys.list(petId), [
          ...previousActivities,
          tempActivity,
        ]);
      }

      return { previousActivities, tempId };
    },
    onError: (_err, { petId }, context) => {
      if (context?.previousActivities) {
        queryClient.setQueryData(activityKeys.list(petId), context.previousActivities);
      }
    },
    onSuccess: (newActivity, { petId }, context) => {
      queryClient.setQueryData<Activity[]>(activityKeys.list(petId), (old = []) => {
        const filtered = context?.tempId
          ? old.filter(activity => activity.id !== context.tempId)
          : old;
        return [newActivity, ...filtered];
      });
      queryClient.setQueryData(activityKeys.detail(newActivity.id), newActivity);
    },
    onSettled: (newActivity, _error, { petId }) => {
      // Always invalidate queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: activityKeys.list(petId) });

      if (newActivity) {
        queryClient.invalidateQueries({ queryKey: activityKeys.detail(newActivity.id) });
      }
    },
  });
}

/**
 * Mutation hook for updating activities with optimistic updates
 */
export function useUpdateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      activityId: number;
      petId: number;
      updates: Partial<ActivityFormData>;
    }) => {
      // Convert to ActivityUpdateRequest format expected by backend
      const updateData: any = {};
      if (data.updates.category) updateData.category = data.updates.category;
      if (data.updates.subcategory) updateData.subcategory = data.updates.subcategory;
      if (data.updates.blocks) updateData.activity_data = data.updates.blocks;

      const result = await invoke('update_activity', {
        activity_id: data.activityId,
        updates: updateData,
      });
      return result as Activity;
    },
    onMutate: async ({ activityId, petId, updates }) => {
      // Cancel queries
      await queryClient.cancelQueries({ queryKey: activityKeys.list(petId) });
      await queryClient.cancelQueries({ queryKey: activityKeys.detail(activityId) });

      // Snapshot previous values
      const previousActivities = queryClient.getQueryData<Activity[]>(activityKeys.list(petId));
      const previousActivity = queryClient.getQueryData<Activity>(activityKeys.detail(activityId));

      // Optimistically update
      if (previousActivities) {
        queryClient.setQueryData<Activity[]>(
          activityKeys.list(petId),
          previousActivities.map(activity =>
            activity.id === activityId
              ? { ...activity, ...updates, updated_at: new Date().toISOString() }
              : activity,
          ),
        );
      }

      if (previousActivity) {
        queryClient.setQueryData<Activity>(activityKeys.detail(activityId), {
          ...previousActivity,
          ...updates,
          updated_at: new Date().toISOString(),
        });
      }

      return { previousActivities, previousActivity };
    },
    onError: (_err, { activityId, petId }, context) => {
      // Rollback on error
      if (context?.previousActivities) {
        queryClient.setQueryData(activityKeys.list(petId), context.previousActivities);
      }
      if (context?.previousActivity) {
        queryClient.setQueryData(activityKeys.detail(activityId), context.previousActivity);
      }
    },
    onSuccess: (updatedActivity, { petId }) => {
      // Update caches with server response
      queryClient.setQueryData<Activity[]>(activityKeys.list(petId), (old = []) =>
        old.map(activity => (activity.id === updatedActivity.id ? updatedActivity : activity)),
      );

      queryClient.setQueryData(activityKeys.detail(updatedActivity.id), updatedActivity);
    },
    onSettled: (_updatedActivity, _error, { activityId, petId }) => {
      // Invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: activityKeys.list(petId) });
      queryClient.invalidateQueries({ queryKey: activityKeys.detail(activityId) });
    },
  });
}

/**
 * Mutation hook for deleting activities with optimistic updates
 */
export function useDeleteActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { activityId: number; petId: number }) => {
      await invoke('delete_activity', { activityId: data.activityId });
      return data.activityId;
    },
    onMutate: async ({ activityId, petId }) => {
      // Cancel queries
      await queryClient.cancelQueries({ queryKey: activityKeys.list(petId) });

      // Snapshot previous value
      const previousActivities = queryClient.getQueryData<Activity[]>(activityKeys.list(petId));

      // Optimistically remove
      if (previousActivities) {
        queryClient.setQueryData<Activity[]>(
          activityKeys.list(petId),
          previousActivities.filter(activity => activity.id !== activityId),
        );
      }

      return { previousActivities };
    },
    onError: (_err, { activityId: _activityId, petId }, context) => {
      // Rollback on error
      if (context?.previousActivities) {
        queryClient.setQueryData(activityKeys.list(petId), context.previousActivities);
      }
    },
    onSuccess: (deletedId, { petId: _petId }) => {
      // Remove from detail cache
      queryClient.removeQueries({ queryKey: activityKeys.detail(deletedId) });
    },
    onSettled: (_deletedId, _error, { petId }) => {
      // Invalidate list to ensure consistency
      queryClient.invalidateQueries({ queryKey: activityKeys.list(petId) });
    },
  });
}
