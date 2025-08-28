import React, { useState, useEffect } from 'react'
import { Pet } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Edit, Calendar, Scale, Palette, Heart, FileText, Camera } from 'lucide-react'
import { cn, calculateAge, formatDate, formatWeight, getDefaultPetPhoto } from '@/lib/utils'
import { usePhotos } from '@/hooks/usePhotos'

interface PetDetailViewProps {
  pet: Pet
  onBack: () => void
  onEdit: (pet: Pet) => void
  className?: string
}

export function PetDetailView({ pet, onBack, onEdit, className }: PetDetailViewProps) {
  const [photoUrl, setPhotoUrl] = useState<string>(getDefaultPetPhoto())
  const [imageError, setImageError] = useState(false)
  const { getPhotoPath } = usePhotos()

  useEffect(() => {
    const loadPhoto = async () => {
      if (pet.photo_path && !imageError) {
        try {
          const fullPath = await getPhotoPath(pet.photo_path)
          setPhotoUrl(`asset://localhost/${fullPath}`)
        } catch (error) {
          console.error('Failed to load pet photo:', error)
          setImageError(true)
          setPhotoUrl(getDefaultPetPhoto())
        }
      } else {
        setPhotoUrl(getDefaultPetPhoto())
      }
    }

    loadPhoto()
  }, [pet.photo_path, getPhotoPath, imageError])

  const handleImageError = () => {
    setImageError(true)
    setPhotoUrl(getDefaultPetPhoto())
  }

  return (
    <div className={cn("max-w-4xl mx-auto p-6", className)}>
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          onClick={onBack}
          className="flex items-center gap-2 text-orange-700 hover:text-orange-800 hover:bg-orange-50"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Pets
        </Button>

        <Button
          onClick={() => onEdit(pet)}
          variant="pet"
          className="flex items-center gap-2"
        >
          <Edit className="w-4 h-4" />
          Edit Profile
        </Button>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hero section with photo and basic info */}
        <div className="lg:col-span-1">
          <Card className="bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200">
            <CardContent className="p-6">
              {/* Pet photo */}
              <div className="relative mb-6">
                <div className="w-full aspect-square rounded-lg overflow-hidden bg-orange-100 border border-orange-200">
                  <img
                    src={photoUrl}
                    alt={`Photo of ${pet.name}`}
                    className="w-full h-full object-cover"
                    onError={handleImageError}
                  />
                </div>
                
                {!pet.photo_path && (
                  <div className="absolute inset-0 flex items-center justify-center bg-orange-100 rounded-lg">
                    <div className="text-center text-orange-400">
                      <Camera className="w-12 h-12 mx-auto mb-2" />
                      <p className="text-sm">No photo uploaded</p>
                    </div>
                  </div>
                )}

                {pet.is_archived && (
                  <div className="absolute top-3 left-3 bg-gray-800 text-white text-xs px-2 py-1 rounded">
                    Archived
                  </div>
                )}
              </div>

              {/* Basic info */}
              <div className="text-center">
                <h1 className="text-2xl font-bold text-orange-900 mb-2">
                  {pet.name}
                </h1>
                <div className="flex items-center justify-center gap-2 text-orange-700 mb-2">
                  <Heart className="w-4 h-4 fill-current" />
                  <span className="capitalize">{pet.species.toLowerCase()}</span>
                </div>
                <p className="text-lg text-orange-600 mb-4">
                  {calculateAge(pet.birth_date)}
                </p>
                
                {/* Quick stats */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-orange-600">Gender:</span>
                    <span className="font-medium capitalize text-orange-900">
                      {pet.gender.toLowerCase()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-orange-600">Weight:</span>
                    <span className="font-medium text-orange-900">
                      {formatWeight(pet.weight_kg)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-orange-600">Pet ID:</span>
                    <span className="font-medium text-orange-900">
                      #{pet.id}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-900">
                <FileText className="w-5 h-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic details */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-orange-700">Full Name</label>
                    <p className="text-orange-900 font-semibold">{pet.name}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-orange-700 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Birth Date
                    </label>
                    <p className="text-orange-900">{formatDate(pet.birth_date)}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-orange-700">Age</label>
                    <p className="text-orange-900">{calculateAge(pet.birth_date)}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-orange-700">Species</label>
                    <p className="text-orange-900 capitalize">{pet.species.toLowerCase()}</p>
                  </div>
                </div>

                {/* Additional details */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-orange-700">Gender</label>
                    <p className="text-orange-900 capitalize">{pet.gender.toLowerCase()}</p>
                  </div>

                  {pet.breed && (
                    <div>
                      <label className="text-sm font-medium text-orange-700">Breed</label>
                      <p className="text-orange-900">{pet.breed}</p>
                    </div>
                  )}

                  {pet.color && (
                    <div>
                      <label className="text-sm font-medium text-orange-700 flex items-center gap-1">
                        <Palette className="w-3 h-3" />
                        Color
                      </label>
                      <p className="text-orange-900">{pet.color}</p>
                    </div>
                  )}

                  {pet.weight_kg && (
                    <div>
                      <label className="text-sm font-medium text-orange-700 flex items-center gap-1">
                        <Scale className="w-3 h-3" />
                        Weight
                      </label>
                      <p className="text-orange-900">{formatWeight(pet.weight_kg)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes section */}
              {pet.notes && (
                <div className="mt-6 pt-6 border-t border-orange-200">
                  <label className="text-sm font-medium text-orange-700 block mb-2">
                    Notes
                  </label>
                  <div className="bg-orange-50 rounded-md p-3 border border-orange-200">
                    <p className="text-orange-900 whitespace-pre-wrap">
                      {pet.notes}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Preview (Placeholder for future implementation) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-orange-900">Recent Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-orange-600">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Activity tracking coming soon!</p>
                <p className="text-xs text-orange-500 mt-1">
                  This will show recent health records, growth milestones, and daily activities.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-orange-700">Record Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-orange-600">Created</label>
                  <p className="text-orange-900">{formatDate(pet.created_at)}</p>
                </div>
                <div>
                  <label className="text-orange-600">Last Updated</label>
                  <p className="text-orange-900">{formatDate(pet.updated_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}