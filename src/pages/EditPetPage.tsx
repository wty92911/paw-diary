import React, { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import { Upload, X, Camera, Loader2, AlertTriangle, ArrowLeft } from 'lucide-react';
import {
  type PetUpdateRequest,
  petFormSchema,
  type PetFormData,
  PetSpecies,
  PetGender,
  SPECIES_OPTIONS,
  GENDER_OPTIONS,
  COMMON_CAT_BREEDS,
  COMMON_DOG_BREEDS,
  COMMON_PET_COLORS,
} from '../lib/types';
import { usePets } from '../hooks/usePets';
import { useRouterNavigation } from '../hooks/usePetProfileNavigation';
import { usePhotos } from '../hooks/usePhotos';
import { usePhotoState } from '../hooks/usePhotoCache';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Card, CardContent } from '../components/ui/card';
import { cn } from '../lib/utils';
import { UniversalHeader, HeaderVariant, BackActionType } from '../components/header';

/**
 * EditPetPage - Dedicated full-page pet editing interface
 *
 * Features:
 * - Pre-populated form with existing pet data
 * - Pet update functionality with optimistic updates
 * - Navigation back to pet profile after successful update
 * - Photo upload and update functionality
 * - Error handling and loading states
 */
export function EditPetPage() {
  const { petId } = useParams<{ petId: string }>();
  const navigate = useNavigate();
  const { pets, updatePet, isLoading: petsLoading } = usePets();
  const { navigateToPetProfile } = useRouterNavigation();
  const { uploadPhoto, isUploading } = usePhotos();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>();
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);

  // Find the current pet
  const currentPet = petId ? pets.find(p => p.id === parseInt(petId, 10)) : null;

  // Use photo state hook to get the correct photo URL
  const { photoUrl: existingPhotoUrl } = usePhotoState(currentPet?.photo_path);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<PetFormData>({
    resolver: zodResolver(petFormSchema),
    defaultValues: {
      name: '',
      species: PetSpecies.Dog,
      breed: '',
      gender: PetGender.Male,
      birth_date: '',
      color: '',
      weight_kg: undefined,
      notes: '',
    },
  });

  // Populate form with existing pet data
  useEffect(() => {
    if (currentPet) {
      reset({
        name: currentPet.name,
        species: currentPet.species,
        breed: currentPet.breed || '',
        gender: currentPet.gender,
        birth_date: currentPet.birth_date,
        color: currentPet.color || '',
        weight_kg: currentPet.weight_kg || undefined,
        notes: currentPet.notes || '',
      });
    }
  }, [currentPet, reset]);

  // Set photo preview when existing photo URL is available
  useEffect(() => {
    if (existingPhotoUrl && !selectedPhotoFile) {
      setPhotoPreview(existingPhotoUrl);
    }
  }, [existingPhotoUrl, selectedPhotoFile]);

  const watchedSpecies = watch('species');
  const watchedGender = watch('gender');
  const watchedBreed = watch('breed');
  const watchedColor = watch('color');

  // Get breed options based on species
  const getBreedOptions = useCallback((species: PetSpecies) => {
    switch (species) {
      case PetSpecies.Cat:
        return COMMON_CAT_BREEDS;
      case PetSpecies.Dog:
        return COMMON_DOG_BREEDS;
      default:
        return [];
    }
  }, []);

  // Handle photo selection
  const handlePhotoSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedPhotoFile(file);
      const reader = new FileReader();
      reader.onload = e => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  // Remove photo preview
  const removePhoto = useCallback(() => {
    setPhotoPreview(undefined);
    setSelectedPhotoFile(null);
  }, []);

  // Handle form submission
  const onSubmit = async (data: PetFormData) => {
    if (!currentPet) return;

    try {
      setIsSubmitting(true);
      setError(null);

      // Upload photo first if selected
      let photoPath = currentPet.photo_path;
      if (selectedPhotoFile) {
        photoPath = await uploadPhoto(selectedPhotoFile);
      }

      // Prepare update data
      const updateData: PetUpdateRequest = {
        name: data.name,
        species: data.species,
        breed: data.breed || undefined,
        gender: data.gender,
        birth_date: data.birth_date,
        color: data.color || undefined,
        weight_kg: data.weight_kg || undefined,
        notes: data.notes || undefined,
        photo_path: photoPath || undefined,
      };

      // Update pet
      await updatePet(currentPet.id, updateData);

      // Navigate back to pet profile
      navigateToPetProfile(currentPet.id);
    } catch (err) {
      console.error('Failed to update pet:', err);
      setError(err instanceof Error ? err.message : 'Failed to update pet');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    if (petId) {
      navigate(`/pets/${petId}`);
    } else {
      navigate('/');
    }
  };

  // Loading state while pets are loading
  if (petsLoading && pets.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-600" />
          <p className="text-orange-700">Loading pet information...</p>
        </div>
      </div>
    );
  }

  // Pet not found
  if (!petId || !currentPet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-orange-900 mb-2">Pet Not Found</h2>
          <p className="text-orange-700 mb-6">
            The pet you're trying to edit doesn't exist or may have been removed.
          </p>
          <Button onClick={() => navigate('/')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
      {/* Universal Header */}
      <UniversalHeader
        configuration={{
          variant: HeaderVariant.FORM,
          title: 'Edit Pet',
          subtitle: currentPet.name,
          showBackButton: true,
          backAction: {
            type: BackActionType.CUSTOM_HANDLER,
            handler: handleBack,
            label: 'Back',
          },
          sticky: true,
        }}
      />

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <Card className="bg-white shadow-lg">
          <CardContent className="p-6">
            {/* Error Display */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Photo Upload Section */}
              <div className="space-y-4">
                <Label>Pet Photo</Label>
                <div className="flex flex-col items-center gap-4">
                  {photoPreview ? (
                    <div className="relative">
                      <img
                        src={photoPreview}
                        alt="Pet preview"
                        className="w-32 h-32 object-cover rounded-2xl border-4 border-orange-200"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-8 w-8 rounded-full p-0"
                        onClick={removePhoto}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="w-32 h-32 border-2 border-dashed border-orange-300 rounded-2xl flex items-center justify-center bg-orange-50">
                      <Camera className="w-8 h-8 text-orange-400" />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="hidden"
                      id="photo-upload"
                      disabled={isUploading}
                    />
                    <Label
                      htmlFor="photo-upload"
                      className={cn(
                        'cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors',
                        isUploading && 'opacity-50 cursor-not-allowed',
                      )}
                    >
                      {isUploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      {photoPreview ? 'Change Photo' : 'Upload Photo'}
                    </Label>
                  </div>
                </div>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="name">Pet Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter pet name"
                    {...register('name')}
                    className={cn(errors.name && 'border-red-300 focus:border-red-500')}
                  />
                  {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
                </div>

                {/* Species */}
                <div className="space-y-2">
                  <Label htmlFor="species">Species *</Label>
                  <Select
                    value={watchedSpecies}
                    onValueChange={value => setValue('species', value as PetSpecies)}
                  >
                    <SelectTrigger id="species" className={cn(errors.species && 'border-red-300')}>
                      <SelectValue placeholder="Select species" />
                    </SelectTrigger>
                    <SelectContent>
                      {SPECIES_OPTIONS.map(species => (
                        <SelectItem key={species.value} value={species.value}>
                          {species.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.species && (
                    <p className="text-sm text-red-600">{errors.species.message}</p>
                  )}
                </div>

                {/* Gender */}
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender *</Label>
                  <Select
                    value={watchedGender}
                    onValueChange={value => setValue('gender', value as PetGender)}
                  >
                    <SelectTrigger id="gender" className={cn(errors.gender && 'border-red-300')}>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDER_OPTIONS.map(gender => (
                        <SelectItem key={gender.value} value={gender.value}>
                          {gender.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.gender && <p className="text-sm text-red-600">{errors.gender.message}</p>}
                </div>
              </div>

              {/* Additional Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Breed */}
                <div className="space-y-2">
                  <Label htmlFor="breed">Breed</Label>
                  <Select value={watchedBreed} onValueChange={value => setValue('breed', value)}>
                    <SelectTrigger id="breed">
                      <SelectValue placeholder="Select breed (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {getBreedOptions(watchedSpecies).map(breed => (
                        <SelectItem key={breed} value={breed}>
                          {breed}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Color */}
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Select value={watchedColor} onValueChange={value => setValue('color', value)}>
                    <SelectTrigger id="color">
                      <SelectValue placeholder="Select color (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_PET_COLORS.map(color => (
                        <SelectItem key={color} value={color}>
                          {color}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Birth Date */}
                <div className="space-y-2">
                  <Label htmlFor="birth_date">Birth Date *</Label>
                  <Input
                    id="birth_date"
                    type="date"
                    {...register('birth_date')}
                    className={cn(errors.birth_date && 'border-red-300 focus:border-red-500')}
                  />
                  {errors.birth_date && (
                    <p className="text-sm text-red-600">{errors.birth_date.message}</p>
                  )}
                </div>

                {/* Weight */}
                <div className="space-y-2">
                  <Label htmlFor="weight_kg">Weight (kg)</Label>
                  <Input
                    id="weight_kg"
                    type="number"
                    step="0.1"
                    placeholder="Enter weight"
                    {...register('weight_kg', { valueAsNumber: true })}
                    className={cn(errors.weight_kg && 'border-red-300 focus:border-red-500')}
                  />
                  {errors.weight_kg && (
                    <p className="text-sm text-red-600">{errors.weight_kg.message}</p>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  placeholder="Any additional notes about your pet..."
                  rows={4}
                  {...register('notes')}
                  className={cn(
                    'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none',
                    errors.notes && 'border-red-300 focus:border-red-500',
                  )}
                />
                {errors.notes && <p className="text-sm text-red-600">{errors.notes.message}</p>}
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || isUploading}
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Updating...
                    </>
                  ) : (
                    'Update Pet'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default EditPetPage;
