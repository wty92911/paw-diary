import React, { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Upload, X, Camera, Loader2 } from 'lucide-react';
import {
  PetCreateRequest,
  petFormSchema,
  PetFormData,
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
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { cn } from '../lib/utils';
import { UniversalHeader, HeaderVariant, BackActionType } from '../components/header';

/**
 * AddPetPage - Dedicated full-page pet creation interface
 *
 * Features:
 * - Integrated pet creation form (no nested scrollbars)
 * - Navigation to pet profile after successful creation
 * - Back navigation to homepage
 * - Error handling and loading states
 * - Photo upload functionality
 */
export function AddPetPage() {
  const { createPet } = usePets();
  const { navigateToPetProfile, navigateToHome } = useRouterNavigation();
  const { uploadPhoto, isUploading } = usePhotos();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>();
  const [photoFile, setPhotoFile] = useState<File>();
  const [selectedSpecies, setSelectedSpecies] = useState<PetSpecies>();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    clearErrors,
  } = useForm<PetFormData>({
    resolver: zodResolver(petFormSchema),
    defaultValues: {
      species: PetSpecies.Cat,
      gender: PetGender.Unknown,
    },
  });

  const watchedSpecies = watch('species');

  // Update selected species when form value changes
  useEffect(() => {
    setSelectedSpecies(watchedSpecies);
  }, [watchedSpecies]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = e => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Clear any previous photo errors
      clearErrors('photo');
    }
  };

  const handlePhotoRemove = () => {
    setPhotoFile(undefined);
    setPhotoPreview(undefined);
    const fileInput = document.getElementById('photo-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const getBreedOptions = () => {
    if (selectedSpecies === PetSpecies.Cat) {
      return COMMON_CAT_BREEDS;
    } else if (selectedSpecies === PetSpecies.Dog) {
      return COMMON_DOG_BREEDS;
    }
    return [];
  };

  // Handle form submission
  const handleFormSubmit = useCallback(
    async (data: PetFormData) => {
      try {
        setIsSubmitting(true);
        setError(null);

        let photoPath;

        // Upload photo if one was selected
        if (photoFile) {
          photoPath = await uploadPhoto(photoFile);
        }

        // Prepare form data
        const formData: PetCreateRequest = {
          name: data.name,
          birth_date: data.birth_date,
          species: data.species,
          gender: data.gender,
          breed: data.breed || undefined,
          color: data.color || undefined,
          weight_kg: typeof data.weight_kg === 'number' ? data.weight_kg : undefined,
          notes: data.notes || undefined,
          photo_path: photoPath,
        };

        console.log('Creating new pet:', formData);

        const newPet = await createPet(formData);

        console.log('Pet created successfully:', newPet);

        // Navigate to the new pet's profile page
        navigateToPetProfile(newPet.id);
      } catch (err) {
        console.error('Failed to create pet:', err);
        setError(err instanceof Error ? err.message : 'Failed to create pet');
      } finally {
        setIsSubmitting(false);
      }
    },
    [createPet, navigateToPetProfile, photoFile, uploadPhoto],
  );

  // Handle back navigation
  const handleBack = useCallback(() => {
    navigateToHome();
  }, [navigateToHome]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex flex-col">
      {/* Universal Header */}
      <UniversalHeader
        configuration={{
          variant: HeaderVariant.FORM,
          title: 'Add New Pet',
          subtitle: "Create your pet's profile",
          showBackButton: true,
          backAction: {
            type: BackActionType.CUSTOM_HANDLER,
            handler: handleBack,
            label: 'Back',
            disabled: isSubmitting || isUploading,
          },
          sticky: true,
        }}
      />

      {/* Main scrollable content */}
      <main className="flex-1 overflow-y-auto pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Error display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Pet Form */}
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 max-w-2xl mx-auto">
            {/* Photo upload section */}
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-orange-900">Pet Photo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center space-y-4">
                  {/* Photo preview */}
                  <div className="relative">
                    <div className="w-32 h-32 rounded-lg overflow-hidden bg-orange-50 border-2 border-dashed border-orange-200 flex items-center justify-center">
                      {photoPreview ? (
                        <img
                          src={photoPreview}
                          alt="Pet preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Camera className="w-8 h-8 text-orange-400" />
                      )}
                    </div>

                    {photoPreview && (
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        className="absolute -top-2 -right-2 w-6 h-6"
                        onClick={handlePhotoRemove}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>

                  {/* Upload button */}
                  <div className="flex flex-col items-center space-y-2">
                    <Label htmlFor="photo-upload" className="cursor-pointer">
                      <div className="flex items-center space-x-2 bg-orange-100 hover:bg-orange-200 text-orange-700 px-6 py-3 rounded-md transition-colors">
                        <Upload className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {photoPreview ? 'Change Photo' : 'Upload Photo'}
                        </span>
                      </div>
                    </Label>
                    <Input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <p className="text-xs text-orange-600 text-center">PNG, JPG, WebP up to 10MB</p>
                  </div>

                  {errors.photo && <p className="text-sm text-red-600">{errors.photo.message}</p>}
                </div>
              </CardContent>
            </Card>

            {/* Basic information */}
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-orange-900">
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Pet Name *</Label>
                  <Input
                    id="name"
                    {...register('name')}
                    placeholder="Enter pet name"
                    className={cn(errors.name && 'border-red-500')}
                  />
                  {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
                </div>

                {/* Birth Date */}
                <div className="space-y-2">
                  <Label htmlFor="birth_date">Birth Date *</Label>
                  <Input
                    id="birth_date"
                    type="date"
                    {...register('birth_date')}
                    className={cn(errors.birth_date && 'border-red-500')}
                  />
                  {errors.birth_date && (
                    <p className="text-sm text-red-600">{errors.birth_date.message}</p>
                  )}
                </div>

                {/* Species */}
                <div className="space-y-2">
                  <Label htmlFor="species">Species *</Label>
                  <Select
                    value={watch('species')}
                    onValueChange={(value: PetSpecies) => setValue('species', value)}
                  >
                    <SelectTrigger className={cn(errors.species && 'border-red-500')}>
                      <SelectValue placeholder="Select species" />
                    </SelectTrigger>
                    <SelectContent>
                      {SPECIES_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
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
                    value={watch('gender')}
                    onValueChange={(value: PetGender) => setValue('gender', value)}
                  >
                    <SelectTrigger className={cn(errors.gender && 'border-red-500')}>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDER_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.gender && <p className="text-sm text-red-600">{errors.gender.message}</p>}
                </div>
              </CardContent>
            </Card>

            {/* Additional information */}
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-orange-900">
                  Additional Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Breed */}
                <div className="space-y-2">
                  <Label htmlFor="breed">Breed</Label>
                  <Select
                    value={watch('breed') || ''}
                    onValueChange={value => setValue('breed', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select breed (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {getBreedOptions().map(breed => (
                        <SelectItem key={breed} value={breed}>
                          {breed}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.breed && <p className="text-sm text-red-600">{errors.breed.message}</p>}
                </div>

                {/* Color */}
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Select
                    value={watch('color') || ''}
                    onValueChange={value => setValue('color', value)}
                  >
                    <SelectTrigger>
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
                  {errors.color && <p className="text-sm text-red-600">{errors.color.message}</p>}
                </div>

                {/* Weight */}
                <div className="space-y-2">
                  <Label htmlFor="weight_kg">Weight (kg)</Label>
                  <Input
                    id="weight_kg"
                    type="number"
                    step="0.1"
                    min="0"
                    max="200"
                    {...register('weight_kg', { valueAsNumber: true })}
                    placeholder="Enter weight in kg (optional)"
                    className={cn(errors.weight_kg && 'border-red-500')}
                  />
                  {errors.weight_kg && (
                    <p className="text-sm text-red-600">{errors.weight_kg.message}</p>
                  )}
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <textarea
                    id="notes"
                    {...register('notes')}
                    rows={3}
                    placeholder="Any additional notes about your pet (optional)"
                    className={cn(
                      'flex w-full rounded-md border border-input bg-background px-3 py-2 ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none',
                      errors.notes && 'border-red-500',
                    )}
                  />
                  {errors.notes && <p className="text-sm text-red-600">{errors.notes.message}</p>}
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="pt-6 pb-12">
              <Button
                type="submit"
                disabled={isSubmitting || isUploading}
                className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white text-base font-medium"
              >
                {(isSubmitting || isUploading) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Pet
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default AddPetPage;
