import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Pet,
  PetCreateRequest,
  PetUpdateRequest,
  petFormSchema,
  PetFormData,
  PetSpecies,
  PetGender,
  SPECIES_OPTIONS,
  GENDER_OPTIONS,
  COMMON_CAT_BREEDS,
  COMMON_DOG_BREEDS,
  COMMON_PET_COLORS,
} from '../../lib/types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Upload, X, Camera, Loader2, ArrowLeft } from 'lucide-react';
import { cn } from '../../lib/utils';
import { usePhotos } from '../../hooks/usePhotos';

interface PetFormPageProps {
  pet?: Pet;
  onSubmit: (data: PetCreateRequest | PetUpdateRequest) => Promise<void>;
  onBack: () => void;
  isSubmitting?: boolean;
}

export function PetFormPage({ pet, onSubmit, onBack, isSubmitting = false }: PetFormPageProps) {
  const isEditing = Boolean(pet);
  const [photoPreview, setPhotoPreview] = useState<string>();
  const [photoFile, setPhotoFile] = useState<File>();
  const [selectedSpecies, setSelectedSpecies] = useState<PetSpecies>();

  const { uploadPhoto, isUploading } = usePhotos();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    clearErrors,
  } = useForm<PetFormData>({
    resolver: zodResolver(petFormSchema),
    defaultValues: isEditing
      ? {
          name: pet?.name,
          birth_date: pet?.birth_date,
          species: pet?.species,
          gender: pet?.gender,
          breed: pet?.breed || '',
          color: pet?.color || '',
          weight_kg: pet?.weight_kg || undefined,
          notes: pet?.notes || '',
        }
      : {
          species: PetSpecies.Cat,
          gender: PetGender.Unknown,
        },
  });

  const watchedSpecies = watch('species');

  // Update selected species when form value changes
  useEffect(() => {
    setSelectedSpecies(watchedSpecies);
  }, [watchedSpecies]);

  // Load existing photo for editing
  useEffect(() => {
    if (isEditing && pet?.photo_path) {
      // Use custom photos:// protocol instead of asset://
      // This works on iOS where asset:// is restricted to bundled resources
      setPhotoPreview(`photos://localhost/${pet.photo_path}`);
    }
  }, [isEditing, pet]);

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
    const fileInput = document.getElementById('photo-upload-mobile') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleFormSubmit = async (data: PetFormData) => {
    try {
      let photoPath = pet?.photo_path;

      // Upload new photo if one was selected
      if (photoFile) {
        photoPath = await uploadPhoto(photoFile);
      }

      // Prepare form data
      const formData = {
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

      await onSubmit(formData);
      onBack(); // Navigate back on success
    } catch (error) {
      console.error('Failed to submit form:', error);
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

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col">
      {/* Mobile Header with Back Button */}
      <div className="bg-white border-b border-cream-200 p-4 flex items-center space-x-4 sticky top-0 z-10">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onBack}
          disabled={isSubmitting || isUploading}
          className="h-10 w-10"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            {isEditing ? `Edit ${pet?.name}` : 'Add New Pet'}
          </h1>
          <p className="text-sm text-gray-600">
            {isEditing
              ? "Update your pet's information"
              : "Fill in your pet's information to create their profile"}
          </p>
        </div>
      </div>

      {/* Scrollable Form Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-8">
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 max-w-lg mx-auto">
          {/* Photo upload section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">Pet Photo</CardTitle>
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
                  <Label htmlFor="photo-upload-mobile" className="cursor-pointer">
                    <div className="flex items-center space-x-2 bg-orange-100 hover:bg-orange-200 text-orange-700 px-6 py-3 rounded-md transition-colors">
                      <Upload className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {photoPreview ? 'Change Photo' : 'Upload Photo'}
                      </span>
                    </div>
                  </Label>
                  <Input
                    id="photo-upload-mobile"
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
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name-mobile">Pet Name *</Label>
                <Input
                  id="name-mobile"
                  {...register('name')}
                  placeholder="Enter pet name"
                  className={cn(errors.name && 'border-red-500', 'text-base')}
                />
                {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
              </div>

              {/* Birth Date */}
              <div className="space-y-2">
                <Label htmlFor="birth_date-mobile">Birth Date *</Label>
                <Input
                  id="birth_date-mobile"
                  type="date"
                  {...register('birth_date')}
                  className={cn(errors.birth_date && 'border-red-500', 'text-base')}
                />
                {errors.birth_date && (
                  <p className="text-sm text-red-600">{errors.birth_date.message}</p>
                )}
              </div>

              {/* Species */}
              <div className="space-y-2">
                <Label htmlFor="species-mobile">Species *</Label>
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
                {errors.species && <p className="text-sm text-red-600">{errors.species.message}</p>}
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <Label htmlFor="gender-mobile">Gender *</Label>
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
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">Additional Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Breed */}
              <div className="space-y-2">
                <Label htmlFor="breed-mobile">Breed</Label>
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
                <Label htmlFor="color-mobile">Color</Label>
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
                <Label htmlFor="weight_kg-mobile">Weight (kg)</Label>
                <Input
                  id="weight_kg-mobile"
                  type="number"
                  step="0.1"
                  min="0"
                  max="200"
                  {...register('weight_kg', { valueAsNumber: true })}
                  placeholder="Enter weight in kg (optional)"
                  className={cn(errors.weight_kg && 'border-red-500', 'text-base')}
                />
                {errors.weight_kg && (
                  <p className="text-sm text-red-600">{errors.weight_kg.message}</p>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes-mobile">Notes</Label>
                <textarea
                  id="notes-mobile"
                  {...register('notes')}
                  rows={3}
                  placeholder="Any additional notes about your pet (optional)"
                  className={cn(
                    'flex w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none',
                    errors.notes && 'border-red-500',
                  )}
                />
                {errors.notes && <p className="text-sm text-red-600">{errors.notes.message}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Submit Button - Fixed at bottom */}
          <div className="sticky bottom-4 bg-cream-50 pt-4">
            <Button
              type="submit"
              variant="pet"
              disabled={isSubmitting || isUploading}
              className="w-full h-12 text-base font-medium"
            >
              {(isSubmitting || isUploading) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? 'Update Pet' : 'Create Pet'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
