# React Query Optimization Documentation

This document explains the optimized React Query setup for the Paw Diary application.

## Key Optimizations Implemented

### 1. Pet-Scoped Cache Keys
```typescript
// Before (prone to cross-pet data leakage)
queryKey: ['activities', petId]

// After (structured hierarchical keys)
queryKey: activityKeys.list(petId) // ['activities', 'list', petId]
```

**Benefits:**
- Prevents cross-pet data contamination
- Hierarchical invalidation (can invalidate all activities or just one pet's)
- Consistent key structure across the application

### 2. Optimistic Updates
All mutations now include optimistic updates that:
- Show changes immediately in the UI
- Automatically rollback on errors
- Sync with server response on success
- Maintain cache consistency

### 3. Intelligent Cache Management
```typescript
// Automatic cleanup and garbage collection
gcTime: 5 * 60 * 1000, // 5 minutes for activities
staleTime: 30000, // 30 seconds
enabled: !!petId, // Conditional queries
```

### 4. Cross-Pet Prefetching
```typescript
// Prefetch other pets' activities for instant switching
const { prefetchOtherPets } = useActivitiesList(currentPetId);
prefetchOtherPets([pet1Id, pet2Id, pet3Id]);
```

## Usage Examples

### Basic Activity Fetching
```typescript
import { useActivities } from '../hooks/useActivities';

function ActivityList({ petId }: { petId: number }) {
  const { data: activities, isLoading, error } = useActivities(petId);
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      {activities.map(activity => (
        <ActivityCard key={activity.id} activity={activity} />
      ))}
    </div>
  );
}
```

### Creating Activities with Optimistic Updates
```typescript
import { useCreateActivity } from '../hooks/useActivities';

function CreateActivityButton({ petId }: { petId: number }) {
  const createMutation = useCreateActivity();
  
  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync({
        petId,
        activityData: {
          category: 'health',
          subcategory: 'checkup',
          title: 'Vet Visit',
          notes: 'Regular checkup',
        }
      });
      // UI updates immediately, syncs with server in background
    } catch (error) {
      // Automatically rolled back on error
    }
  };
  
  return (
    <button 
      onClick={handleCreate}
      disabled={createMutation.isPending}
    >
      {createMutation.isPending ? 'Creating...' : 'Create Activity'}
    </button>
  );
}
```

### Advanced List Management
```typescript
import { useActivitiesList } from '../hooks/useActivitiesList';

function AdvancedActivityList({ petId, allPetIds }: Props) {
  const {
    filteredActivities,
    isLoading,
    updateFilters,
    deleteActivity,
    duplicateActivity,
    prefetchOtherPets
  } = useActivitiesList(petId);
  
  // Prefetch other pets' data for instant switching
  useEffect(() => {
    prefetchOtherPets(allPetIds);
  }, [allPetIds, prefetchOtherPets]);
  
  const handleDelete = async (activityId: number) => {
    // Optimistic delete - removed from UI immediately
    await deleteActivity(activityId);
  };
  
  return (
    <div>
      <FilterBar onFilterChange={updateFilters} />
      {filteredActivities.map(activity => (
        <ActivityCard 
          key={activity.id}
          activity={activity}
          onDelete={() => handleDelete(activity.id)}
        />
      ))}
    </div>
  );
}
```

### Draft Management
```typescript
import { useActivityDrafts, useSaveActivityDraft } from '../hooks/useActivityDrafts';

function DraftManager({ petId }: { petId: number }) {
  const { data: drafts } = useActivityDrafts(petId);
  const saveMutation = useSaveActivityDraft();
  
  const handleSave = async (draftData: any) => {
    // Optimistic save with immediate feedback
    await saveMutation.mutateAsync({ draftData });
  };
  
  return (
    <div>
      {drafts?.map(draft => (
        <DraftCard key={draft.id} draft={draft} onSave={handleSave} />
      ))}
    </div>
  );
}
```

## Cache Invalidation Patterns

### Manual Invalidation
```typescript
import { useInvalidateActivities } from '../hooks/useActivities';

function RefreshButton({ petId }: { petId: number }) {
  const invalidate = useInvalidateActivities();
  
  return (
    <button onClick={() => invalidate(petId)}>
      Refresh Activities
    </button>
  );
}
```

### Automatic Invalidation
All mutations automatically handle cache invalidation:
- Create: Adds to cache and invalidates list
- Update: Updates both list and detail caches  
- Delete: Removes from all caches
- Errors: Rolls back optimistic updates

## Performance Benefits

1. **Instant UI Updates**: Optimistic updates show changes immediately
2. **Reduced Network Requests**: Intelligent caching prevents unnecessary calls
3. **Cross-Pet Performance**: Prefetching enables instant pet switching
4. **Consistent State**: Automatic cache management prevents stale data
5. **Error Resilience**: Automatic rollbacks on failure

## Best Practices

1. **Use Structured Keys**: Always use the exported key factories
2. **Enable Conditional Queries**: Use `enabled` flag to prevent unnecessary calls
3. **Handle Loading States**: Always show loading indicators for better UX
4. **Implement Optimistic Updates**: For better perceived performance
5. **Prefetch Strategically**: Prefetch data users are likely to need next

## Migration from Basic Setup

If you have existing components using basic queries:

```typescript
// Before
const { data } = useQuery(['activities', petId], fetchActivities);

// After  
const { data } = useActivities(petId);
```

The new hooks provide the same interface but with all optimizations built-in.