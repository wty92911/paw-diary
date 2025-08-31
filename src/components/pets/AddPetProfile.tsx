import React, { useState } from 'react';
import { PetCreateRequest, PetUpdateRequest } from '../../lib/types';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { PetForm } from './PetForm';
import { cn } from '../../lib/utils';
import { Plus, ArrowLeft, Heart, Camera, Sparkles } from 'lucide-react';

interface AddPetProfileProps {
  onSubmit: (data: PetCreateRequest) => Promise<void>;
  onBack?: () => void;
  isSubmitting?: boolean;
  currentIndex?: number;
  totalPets?: number;
  className?: string;
}

export function AddPetProfile({
  onSubmit,
  onBack,
  isSubmitting = false,
  currentIndex,
  totalPets,
  className,
}: AddPetProfileProps) {
  const [showForm, setShowForm] = useState(false);

  const handleGetStarted = () => {
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
  };

  const handleFormSubmit = async (data: PetCreateRequest | PetUpdateRequest) => {
    // For AddPetProfile, we only expect PetCreateRequest
    await onSubmit(data as PetCreateRequest);
    setShowForm(false);
  };

  if (showForm) {
    return (
      <div className={cn('min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50', className)}>
        {/* Navigation Header */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-orange-200">
          <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
            {/* Back button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleFormClose}
              className="text-orange-700 hover:text-orange-800 hover:bg-orange-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>

            {/* Title */}
            <div className="text-center">
              <h1 className="text-lg font-semibold text-orange-900">Add New Pet</h1>
            </div>

            {/* Spacer for alignment */}
            <div className="w-10" />
          </div>
        </div>

        {/* Form Content */}
        <div className="max-w-md mx-auto px-4 py-6">
          <PetForm
            open={true}
            onOpenChange={handleFormClose}
            onSubmit={handleFormSubmit}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={cn('min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50', className)}>
      {/* Navigation Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-orange-200">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          {/* Back button */}
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="text-orange-700 hover:text-orange-800 hover:bg-orange-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}

          {/* Pet counter */}
          {typeof currentIndex === 'number' && typeof totalPets === 'number' && (
            <div className="text-center">
              <p className="text-sm font-medium text-orange-900">
                {currentIndex + 1} of {totalPets + 1}
              </p>
              <div className="flex gap-1 mt-1">
                {Array.from({ length: totalPets + 1 }, (_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'w-2 h-2 rounded-full transition-colors',
                      i === currentIndex ? 'bg-orange-500' : 'bg-orange-200',
                    )}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Spacer */}
          <div className="w-10" />
        </div>
      </div>

      {/* Add Pet Welcome Content */}
      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Hero Section */}
        <div className="text-center">
          {/* Add Pet Icon */}
          <div className="relative mx-auto mb-6">
            <div className="w-80 h-80 bg-gradient-to-br from-orange-100 to-yellow-100 border-2 border-dashed border-orange-300 rounded-3xl flex items-center justify-center group hover:border-orange-400 transition-colors">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-4 bg-orange-200 rounded-full flex items-center justify-center group-hover:bg-orange-300 transition-colors">
                  <Plus className="w-12 h-12 text-orange-600" />
                </div>
                <Camera className="w-8 h-8 mx-auto text-orange-400 opacity-50" />
              </div>
            </div>

            {/* Decorative elements */}
            <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 animate-pulse" />
            <Heart className="absolute -bottom-1 -left-1 w-5 h-5 text-orange-400 fill-current animate-bounce" />
          </div>

          {/* Welcome Text */}
          <div className="space-y-2 mb-8">
            <h1 className="text-3xl font-bold text-orange-900">Add Your Pet</h1>
            <p className="text-lg text-orange-600">Welcome your furry friend to the family!</p>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="space-y-4">
          <FeatureCard
            icon={Camera}
            title="Add a Photo"
            description="Capture your pet's personality with a beautiful profile photo"
            color="orange"
          />
          <FeatureCard
            icon={Heart}
            title="Create Profile"
            description="Share your pet's story with breed, age, and personal details"
            color="red"
          />
          <FeatureCard
            icon={Sparkles}
            title="Track Activities"
            description="Start recording health, growth, diet, and daily activities"
            color="yellow"
          />
        </div>

        {/* Get Started Button */}
        <div className="pt-4">
          <Button
            onClick={handleGetStarted}
            size="lg"
            className="w-full h-14 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-bold text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus className="w-6 h-6 mr-2" />
            Get Started
          </Button>
        </div>

        {/* Bottom spacing for safe area */}
        <div className="h-8" />
      </div>
    </div>
  );
}

// Feature highlight card
interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  color: 'orange' | 'red' | 'yellow';
}

function FeatureCard({ icon: Icon, title, description, color }: FeatureCardProps) {
  const colorClasses = {
    orange: {
      bg: 'from-orange-50 to-amber-50',
      border: 'border-orange-200',
      icon: 'text-orange-600 bg-orange-100',
      title: 'text-orange-900',
      description: 'text-orange-700',
    },
    red: {
      bg: 'from-red-50 to-rose-50',
      border: 'border-red-200',
      icon: 'text-red-600 bg-red-100',
      title: 'text-red-900',
      description: 'text-red-700',
    },
    yellow: {
      bg: 'from-yellow-50 to-amber-50',
      border: 'border-yellow-200',
      icon: 'text-yellow-600 bg-yellow-100',
      title: 'text-yellow-900',
      description: 'text-yellow-700',
    },
  };

  const classes = colorClasses[color];

  return (
    <Card className={cn('bg-gradient-to-br', classes.bg, classes.border)}>
      <CardContent className="p-4 flex items-start gap-3">
        <div
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
            classes.icon,
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className={cn('font-semibold mb-1', classes.title)}>{title}</h3>
          <p className={cn('text-sm', classes.description)}>{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// Loading skeleton for add pet profile
export function AddPetProfileSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50', className)}>
      {/* Navigation Header Skeleton */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-orange-200">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
          <div className="text-center space-y-2">
            <div className="w-16 h-4 bg-gray-200 rounded animate-pulse mx-auto" />
            <div className="flex gap-1 justify-center">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="w-2 h-2 bg-gray-200 rounded-full animate-pulse" />
              ))}
            </div>
          </div>
          <div className="w-10" />
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="max-w-md mx-auto px-4 py-6 space-y-6 animate-pulse">
        {/* Hero section skeleton */}
        <div className="text-center space-y-4">
          <div className="w-80 h-80 bg-gray-200 rounded-3xl mx-auto" />
          <div className="space-y-2">
            <div className="w-32 h-8 bg-gray-200 rounded mx-auto" />
            <div className="w-48 h-6 bg-gray-200 rounded mx-auto" />
          </div>
        </div>

        {/* Feature cards skeleton */}
        <div className="space-y-4">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="bg-gray-200 rounded-lg h-16" />
          ))}
        </div>

        {/* Button skeleton */}
        <div className="w-full h-14 bg-gray-200 rounded-2xl" />
      </div>
    </div>
  );
}
