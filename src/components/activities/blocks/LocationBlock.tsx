import React from 'react';
import { Control, FieldError } from 'react-hook-form';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { MapPin, Navigation, History, Star } from 'lucide-react';
import { ActivityFormData, ActivityBlockDef } from '../../../lib/types/activities';
import { Field } from './Field';
import { useFormContext } from './FormContext';

// Location value interface
interface LocationValue {
  name: string; // Display name (e.g., "Central Park", "Home", "Vet Clinic")
  address?: string; // Full address
  coordinates?: {
    lat: number;
    lng: number;
  };
  type?: LocationType;
  notes?: string;
  isFavorite?: boolean;
}

// Location types for categorization
type LocationType = 
  | 'home' 
  | 'vet' 
  | 'park' 
  | 'store' 
  | 'groomer' 
  | 'boarding' 
  | 'training' 
  | 'other';

// Location type configurations
const LOCATION_TYPES = {
  home: { label: 'Home', icon: '🏠', color: 'text-blue-600' },
  vet: { label: 'Veterinary', icon: '🏥', color: 'text-red-600' },
  park: { label: 'Park/Outdoor', icon: '🌳', color: 'text-green-600' },
  store: { label: 'Pet Store', icon: '🛍️', color: 'text-purple-600' },
  groomer: { label: 'Grooming', icon: '✂️', color: 'text-pink-600' },
  boarding: { label: 'Boarding', icon: '🏨', color: 'text-orange-600' },
  training: { label: 'Training', icon: '🎓', color: 'text-indigo-600' },
  other: { label: 'Other', icon: '📍', color: 'text-gray-600' },
} as const;

// Mock recent locations - would come from location history hook
const getMockRecentLocations = (_petId?: number): Array<LocationValue & { lastUsed: Date }> => [
  {
    name: 'Central Park Dog Run',
    address: 'Central Park, New York, NY',
    type: 'park',
    isFavorite: true,
    lastUsed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    name: 'Happy Pets Veterinary',
    address: '123 Main St, Anytown, USA',
    type: 'vet',
    isFavorite: true,
    lastUsed: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    name: 'Home',
    address: '456 Oak Avenue, Hometown, USA',
    type: 'home',
    isFavorite: true,
    lastUsed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    name: 'Paws & Claws Pet Store',
    address: '789 Pine St, Shopping Center',
    type: 'store',
    lastUsed: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
];

// Location block specific props
interface LocationBlockProps {
  block: ActivityBlockDef & { type: 'location' };
  control?: Control<ActivityFormData>;
  error?: FieldError;
}

// LocationBlock component for location tracking with favorites and history
const LocationBlock: React.FC<LocationBlockProps> = ({
  block,
  error,
}) => {
  const { watch, setValue, petId } = useFormContext();
  const fieldName = `blocks.${block.id}` as const;
  const currentValue: LocationValue | undefined = watch(fieldName);

  // State management
  const [showRecentLocations, setShowRecentLocations] = React.useState(false);
  const [isCurrentLocation, setIsCurrentLocation] = React.useState(false);

  // Mock recent locations
  const recentLocations = React.useMemo(() => getMockRecentLocations(petId), [petId]);

  // Handle field changes
  const handleFieldChange = React.useCallback((field: keyof LocationValue, value: any) => {
    const updatedValue: LocationValue = {
      name: '',
      ...currentValue,
      [field]: value,
    };
    setValue(fieldName, updatedValue);
  }, [currentValue, fieldName, setValue]);

  // Handle location selection from recent/favorites
  const handleLocationSelect = React.useCallback((location: LocationValue) => {
    setValue(fieldName, location);
    setShowRecentLocations(false);
  }, [fieldName, setValue]);

  // Get current location using geolocation API
  const handleGetCurrentLocation = React.useCallback(() => {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser');
      return;
    }

    setIsCurrentLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        // In real implementation, would reverse geocode coordinates to get address
        const updatedValue: LocationValue = {
          ...currentValue,
          name: currentValue?.name || 'Current Location',
          coordinates: {
            lat: latitude,
            lng: longitude,
          },
          address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`, // Temp address
        };
        
        setValue(fieldName, updatedValue);
        setIsCurrentLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        setIsCurrentLocation(false);
      }
    );
  }, [currentValue, fieldName, setValue]);

  // Toggle favorite status
  const handleToggleFavorite = React.useCallback(() => {
    if (currentValue?.name) {
      handleFieldChange('isFavorite', !currentValue.isFavorite);
    }
  }, [currentValue, handleFieldChange]);

  // Format distance (mock - would calculate from coordinates)
  const formatDistance = (_location: LocationValue & { lastUsed: Date }): string => {
    // Mock distance calculation
    const distances = ['0.2 mi', '1.1 mi', '2.5 mi', '3.8 mi'];
    return distances[Math.floor(Math.random() * distances.length)];
  };

  // Get location type info
  const getLocationTypeInfo = (type?: LocationType) => {
    return type ? LOCATION_TYPES[type] : LOCATION_TYPES.other;
  };

  const locationTypeInfo = getLocationTypeInfo(currentValue?.type);

  return (
    <Field
      label={block.label}
      required={block.required}
      error={error?.message}
      hint={block.config?.hint || 'Where did this activity take place?'}
      blockType="location"
      id={`location-${block.id}`}
    >
      <div className="space-y-4">
        {/* Location name input */}
        <div>
          <label className="text-sm font-medium">Location Name</label>
          <div className="mt-1 relative">
            <Input
              type="text"
              placeholder="Enter location name..."
              value={currentValue?.name || ''}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              className="pr-10"
            />
            {currentValue?.name && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleToggleFavorite}
                className={`absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 ${
                  currentValue.isFavorite ? 'text-yellow-500' : 'text-muted-foreground'
                }`}
                aria-label={currentValue.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Star className={`w-4 h-4 ${currentValue.isFavorite ? 'fill-current' : ''}`} />
              </Button>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowRecentLocations(!showRecentLocations)}
            className="flex items-center gap-1 text-xs"
          >
            <History className="w-3 h-3" />
            Recent
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGetCurrentLocation}
            disabled={isCurrentLocation}
            className="flex items-center gap-1 text-xs"
          >
            <Navigation className="w-3 h-3" />
            {isCurrentLocation ? 'Getting...' : 'Current'}
          </Button>
        </div>

        {/* Recent locations */}
        {showRecentLocations && (
          <div className="space-y-2 border rounded-md p-3 bg-muted/30">
            <div className="text-sm font-medium flex items-center gap-2">
              <History className="w-4 h-4" />
              Recent Locations
            </div>
            
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {recentLocations.slice(0, 5).map((location, index) => {
                const typeInfo = getLocationTypeInfo(location.type);
                return (
                  <Button
                    key={index}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLocationSelect(location)}
                    className="w-full justify-start text-left p-2 h-auto"
                  >
                    <div className="flex items-start gap-2 w-full">
                      <div className="flex items-center gap-1">
                        <span role="img" aria-label={typeInfo.label}>
                          {typeInfo.icon}
                        </span>
                        {location.isFavorite && (
                          <Star className="w-3 h-3 text-yellow-500 fill-current" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{location.name}</div>
                        {location.address && (
                          <div className="text-xs text-muted-foreground truncate">
                            {location.address}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">
                          {formatDistance(location)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {Math.floor((Date.now() - location.lastUsed.getTime()) / (24 * 60 * 60 * 1000))}d ago
                        </div>
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowRecentLocations(false)}
              className="w-full text-xs"
            >
              Close
            </Button>
          </div>
        )}

        {/* Address input */}
        <div>
          <label className="text-sm font-medium">Address (Optional)</label>
          <Input
            type="text"
            placeholder="Enter full address..."
            value={currentValue?.address || ''}
            onChange={(e) => handleFieldChange('address', e.target.value)}
            className="mt-1"
          />
        </div>

        {/* Location type */}
        <div>
          <label className="text-sm font-medium">Location Type</label>
          <div className="mt-1 grid grid-cols-4 gap-2">
            {Object.entries(LOCATION_TYPES).map(([type, config]) => (
              <Button
                key={type}
                type="button"
                variant={currentValue?.type === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFieldChange('type', type as LocationType)}
                className="flex flex-col items-center gap-1 h-auto p-2 text-xs"
              >
                <span role="img" aria-label={config.label}>
                  {config.icon}
                </span>
                {config.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Location summary */}
        {currentValue?.name && (
          <div className="bg-primary/5 border border-primary/20 rounded-md p-3">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-primary mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{currentValue.name}</span>
                  {currentValue.isFavorite && (
                    <Star className="w-3 h-3 text-yellow-500 fill-current" />
                  )}
                  <Badge variant="outline" className="text-xs">
                    <span className={locationTypeInfo.color}>
                      {locationTypeInfo.icon} {locationTypeInfo.label}
                    </span>
                  </Badge>
                </div>
                
                {currentValue.address && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {currentValue.address}
                  </div>
                )}
                
                {currentValue.coordinates && (
                  <div className="text-xs text-muted-foreground mt-1">
                    GPS: {currentValue.coordinates.lat.toFixed(6)}, {currentValue.coordinates.lng.toFixed(6)}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="text-sm font-medium">Location Notes (Optional)</label>
          <Input
            type="text"
            placeholder="Any special notes about this location..."
            value={currentValue?.notes || ''}
            onChange={(e) => handleFieldChange('notes', e.target.value)}
            className="mt-1"
          />
        </div>
      </div>
    </Field>
  );
};

export default LocationBlock;