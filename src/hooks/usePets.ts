import { useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { Pet, PetCreateRequest, PetUpdateRequest, PetError } from '../lib/types'

export interface UsePetsState {
  pets: Pet[]
  isLoading: boolean
  error: string | null
}

export interface UsePetsActions {
  refetch: () => Promise<void>
  createPet: (petData: PetCreateRequest) => Promise<Pet>
  updatePet: (id: number, petData: PetUpdateRequest) => Promise<Pet>
  deletePet: (id: number) => Promise<void>
  reorderPets: (petIds: number[]) => Promise<void>
}

export function usePets(includeArchived = false): UsePetsState & UsePetsActions {
  const [pets, setPets] = useState<Pet[]>([])
  const [isLoading, setIsLoading] = useState(false)  // Start as false, don't auto-load
  const [error, setError] = useState<string | null>(null)

  const refetch = async () => {
    console.log('=== REFETCH PETS START ===')
    console.log('includeArchived:', includeArchived)
    
    try {
      console.log('Setting isLoading to true')
      setIsLoading(true)
      setError(null)
      
      console.log('Calling get_pets command...')
      const fetchedPets = await invoke<Pet[]>('get_pets', { includeArchived })
      console.log('get_pets result:', fetchedPets)
      console.log('Number of pets received:', fetchedPets?.length || 0)
      
      setPets(fetchedPets)
      console.log('Pets state updated successfully')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch pets'
      console.error('Failed to fetch pets - Error details:', err)
      console.error('Error type:', typeof err)
      console.error('Error message:', errorMessage)
      setError(errorMessage)
    } finally {
      console.log('Setting isLoading to false')
      setIsLoading(false)
      console.log('=== REFETCH PETS END ===')
    }
  }

  const createPet = async (petData: PetCreateRequest): Promise<Pet> => {
    try {
      setError(null)
      const newPet = await invoke<Pet>('create_pet', { petData })
      setPets(prev => [...prev, newPet])
      return newPet
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create pet'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const updatePet = async (id: number, petData: PetUpdateRequest): Promise<Pet> => {
    try {
      setError(null)
      const updatedPet = await invoke<Pet>('update_pet', { id, petData })
      setPets(prev => prev.map(pet => pet.id === id ? updatedPet : pet))
      return updatedPet
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update pet'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const deletePet = async (id: number): Promise<void> => {
    try {
      setError(null)
      await invoke('delete_pet', { id })
      // Remove from list if not including archived, otherwise refetch to show archived status
      if (!includeArchived) {
        setPets(prev => prev.filter(pet => pet.id !== id))
      } else {
        await refetch()
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete pet'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const reorderPets = async (petIds: number[]): Promise<void> => {
    try {
      setError(null)
      await invoke('reorder_pets', { petIds })
      // Reorder pets in local state to match new order
      const reorderedPets = petIds.map(id => pets.find(pet => pet.id === id)).filter(Boolean) as Pet[]
      setPets(reorderedPets)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reorder pets'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  // Don't auto-fetch - let the app initialize first
  // useEffect(() => {
  //   refetch()
  // }, [includeArchived])

  return {
    pets,
    isLoading,
    error,
    refetch,
    createPet,
    updatePet,
    deletePet,
    reorderPets,
  }
}