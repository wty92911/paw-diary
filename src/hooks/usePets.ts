import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { Pet, PetCreateRequest, PetUpdateRequest, PetError } from '@/lib/types'

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
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const fetchedPets = await invoke<Pet[]>('get_pets', { includeArchived })
      setPets(fetchedPets)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch pets'
      setError(errorMessage)
      console.error('Failed to fetch pets:', err)
    } finally {
      setIsLoading(false)
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

  useEffect(() => {
    refetch()
  }, [includeArchived])

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