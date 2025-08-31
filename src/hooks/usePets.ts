import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Pet, PetCreateRequest, PetUpdateRequest } from '../lib/types';

export interface UsePetsState {
  pets: Pet[];
  isLoading: boolean;
  error: string | null;
  activePetId: number | null;
  activePet: Pet | null;
}

export interface UsePetsActions {
  refetch: () => Promise<void>;
  createPet: (petData: PetCreateRequest) => Promise<Pet>;
  updatePet: (id: number, petData: PetUpdateRequest) => Promise<Pet>;
  deletePet: (id: number) => Promise<void>;
  reorderPets: (petIds: number[]) => Promise<void>;
  setActivePetId: (petId: number | null) => void;
  selectFirstPet: () => void;
  selectPetByIndex: (index: number) => void;
}

export function usePets(includeArchived = false): UsePetsState & UsePetsActions {
  const [pets, setPets] = useState<Pet[]>([]);
  const [isLoading, setIsLoading] = useState(false); // Start as false, don't auto-load
  const [error, setError] = useState<string | null>(null);
  const [activePetId, setActivePetId] = useState<number | null>(null);

  // Computed state
  const activePet = activePetId ? pets.find(pet => pet.id === activePetId) || null : null;

  const refetch = async () => {
    console.log('=== REFETCH PETS START ===');
    console.log('includeArchived:', includeArchived);

    try {
      console.log('Setting isLoading to true');
      setIsLoading(true);
      setError(null);

      console.log('Calling get_pets command...');
      const fetchedPets = await invoke<Pet[]>('get_pets', { includeArchived });
      console.log('get_pets result:', fetchedPets);
      console.log('Number of pets received:', fetchedPets?.length || 0);

      setPets(fetchedPets);
      console.log('Pets state updated successfully');

      // Auto-select first pet if no active pet is selected and pets exist
      if (!activePetId && fetchedPets.length > 0) {
        const firstActivePet = fetchedPets.find(pet => !pet.is_archived);
        if (firstActivePet) {
          setActivePetId(firstActivePet.id);
          console.log('Auto-selected first pet:', firstActivePet.name);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch pets';
      console.error('Failed to fetch pets - Error details:', err);
      console.error('Error type:', typeof err);
      console.error('Error message:', errorMessage);
      setError(errorMessage);
    } finally {
      console.log('Setting isLoading to false');
      setIsLoading(false);
      console.log('=== REFETCH PETS END ===');
    }
  };

  const createPet = async (petData: PetCreateRequest): Promise<Pet> => {
    try {
      setError(null);
      const newPet = await invoke<Pet>('create_pet', { petData });
      setPets(prev => [...prev, newPet]);

      // Auto-select newly created pet if no active pet
      if (!activePetId) {
        setActivePetId(newPet.id);
        console.log('Auto-selected newly created pet:', newPet.name);
      }

      return newPet;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create pet';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updatePet = async (id: number, petData: PetUpdateRequest): Promise<Pet> => {
    try {
      setError(null);
      const updatedPet = await invoke<Pet>('update_pet', { id, petData });
      setPets(prev => prev.map(pet => (pet.id === id ? updatedPet : pet)));
      return updatedPet;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update pet';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deletePet = async (id: number): Promise<void> => {
    try {
      setError(null);
      await invoke('delete_pet', { id });

      // If deleted pet was active, clear active selection
      if (activePetId === id) {
        setActivePetId(null);
        console.log('Cleared active pet selection after deletion');
      }

      // Always refetch to ensure UI state is consistent with database after deletion
      // This guarantees that soft-deleted pets are properly removed from the UI
      await refetch();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete pet';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const reorderPets = async (petIds: number[]): Promise<void> => {
    try {
      setError(null);
      await invoke('reorder_pets', { petIds });
      // Reorder pets in local state to match new order
      const reorderedPets = petIds
        .map(id => pets.find(pet => pet.id === id))
        .filter(Boolean) as Pet[];
      setPets(reorderedPets);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reorder pets';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Navigation functions
  const selectFirstPet = () => {
    const firstActivePet = pets.find(pet => !pet.is_archived);
    if (firstActivePet) {
      setActivePetId(firstActivePet.id);
      console.log('Selected first pet:', firstActivePet.name);
    }
  };

  const selectPetByIndex = (index: number) => {
    const activePets = pets.filter(pet => !pet.is_archived);
    if (index >= 0 && index < activePets.length) {
      const selectedPet = activePets[index];
      setActivePetId(selectedPet.id);
      console.log('Selected pet by index:', selectedPet.name);
    } else {
      console.warn(`Invalid pet index: ${index}. Valid range: 0-${activePets.length - 1}`);
    }
  };

  // Don't auto-fetch - let the app initialize first
  // useEffect(() => {
  //   refetch()
  // }, [includeArchived])

  return {
    pets,
    isLoading,
    error,
    activePetId,
    activePet,
    refetch,
    createPet,
    updatePet,
    deletePet,
    reorderPets,
    setActivePetId,
    selectFirstPet,
    selectPetByIndex,
  };
}
