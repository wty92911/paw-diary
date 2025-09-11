import React from 'react';
import { Control, FieldError } from 'react-hook-form';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Cloud, Sun, CloudRain, Snowflake, Wind, Thermometer, Droplets, Eye, RefreshCw } from 'lucide-react';
import { ActivityFormData, ActivityBlockDef } from '../../../lib/types/activities';
import { Field } from './Field';
import { useFormContext } from './FormContext';

// Weather value interface
interface WeatherValue {
  condition: WeatherCondition;
  temperature: number; // in Celsius
  temperatureUnit: 'C' | 'F';
  humidity?: number; // percentage
  windSpeed?: number; // km/h or mph
  windUnit: 'kmh' | 'mph';
  visibility?: 'poor' | 'fair' | 'good' | 'excellent';
  notes?: string;
  recordedAt: Date;
  isAutoFetched?: boolean; // Whether data was fetched automatically
}

// Weather conditions
type WeatherCondition = 
  | 'sunny' 
  | 'partly_cloudy' 
  | 'cloudy' 
  | 'overcast'
  | 'light_rain' 
  | 'rain' 
  | 'heavy_rain'
  | 'light_snow'
  | 'snow'
  | 'heavy_snow'
  | 'windy'
  | 'foggy'
  | 'stormy';

// Weather condition configurations
const WEATHER_CONDITIONS = {
  sunny: { label: 'Sunny', icon: Sun, emoji: '☀️', color: 'text-yellow-500' },
  partly_cloudy: { label: 'Partly Cloudy', icon: Cloud, emoji: '⛅', color: 'text-gray-400' },
  cloudy: { label: 'Cloudy', icon: Cloud, emoji: '☁️', color: 'text-gray-500' },
  overcast: { label: 'Overcast', icon: Cloud, emoji: '☁️', color: 'text-gray-600' },
  light_rain: { label: 'Light Rain', icon: CloudRain, emoji: '🌦️', color: 'text-blue-400' },
  rain: { label: 'Rain', icon: CloudRain, emoji: '🌧️', color: 'text-blue-500' },
  heavy_rain: { label: 'Heavy Rain', icon: CloudRain, emoji: '⛈️', color: 'text-blue-600' },
  light_snow: { label: 'Light Snow', icon: Snowflake, emoji: '🌨️', color: 'text-blue-200' },
  snow: { label: 'Snow', icon: Snowflake, emoji: '❄️', color: 'text-blue-300' },
  heavy_snow: { label: 'Heavy Snow', icon: Snowflake, emoji: '🌨️', color: 'text-blue-400' },
  windy: { label: 'Windy', icon: Wind, emoji: '💨', color: 'text-gray-400' },
  foggy: { label: 'Foggy', icon: Cloud, emoji: '🌫️', color: 'text-gray-300' },
  stormy: { label: 'Stormy', icon: CloudRain, emoji: '⛈️', color: 'text-purple-600' },
} as const;

// Visibility options
const VISIBILITY_OPTIONS = {
  poor: { label: 'Poor', description: 'Less than 1km visibility' },
  fair: { label: 'Fair', description: '1-4km visibility' },
  good: { label: 'Good', description: '4-10km visibility' },
  excellent: { label: 'Excellent', description: 'Over 10km visibility' },
} as const;

// Weather block specific props
interface WeatherBlockProps {
  block: ActivityBlockDef & { type: 'weather' };
  control?: Control<ActivityFormData>;
  error?: FieldError;
}

// WeatherBlock component for tracking weather conditions
const WeatherBlock: React.FC<WeatherBlockProps> = ({
  block,
  error,
}) => {
  const { watch, setValue } = useFormContext();
  const fieldName = `blocks.${block.id}` as const;
  const currentValue: WeatherValue | undefined = watch(fieldName);

  // State management
  const [isFetching, setIsFetching] = React.useState(false);
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  // Initialize default value
  React.useEffect(() => {
    if (!currentValue) {
      setValue(fieldName, {
        condition: 'sunny',
        temperature: 20,
        temperatureUnit: 'C',
        windUnit: 'kmh',
        recordedAt: new Date(),
      });
    }
  }, [currentValue, fieldName, setValue]);

  // Handle field changes
  const handleFieldChange = React.useCallback((field: keyof WeatherValue, value: any) => {
    if (!currentValue) return;
    
    const updatedValue: WeatherValue = {
      ...currentValue,
      [field]: value,
    };
    setValue(fieldName, updatedValue);
  }, [currentValue, fieldName, setValue]);

  // Convert temperature between C and F
  const convertTemperature = React.useCallback((temp: number, fromUnit: 'C' | 'F', toUnit: 'C' | 'F'): number => {
    if (fromUnit === toUnit) return temp;
    if (fromUnit === 'C' && toUnit === 'F') return (temp * 9/5) + 32;
    if (fromUnit === 'F' && toUnit === 'C') return (temp - 32) * 5/9;
    return temp;
  }, []);

  // Handle temperature unit change
  const handleTemperatureUnitChange = React.useCallback((newUnit: 'C' | 'F') => {
    if (!currentValue) return;
    
    const convertedTemp = convertTemperature(
      currentValue.temperature, 
      currentValue.temperatureUnit, 
      newUnit
    );
    
    const updatedValue: WeatherValue = {
      ...currentValue,
      temperature: Math.round(convertedTemp),
      temperatureUnit: newUnit,
    };
    setValue(fieldName, updatedValue);
  }, [currentValue, fieldName, setValue, convertTemperature]);

  // Mock fetch current weather - would integrate with weather API
  const fetchCurrentWeather = React.useCallback(async () => {
    setIsFetching(true);
    
    // Mock weather data - would come from actual weather API
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockWeatherData: WeatherValue = {
      condition: 'partly_cloudy',
      temperature: 22,
      temperatureUnit: 'C',
      humidity: 65,
      windSpeed: 15,
      windUnit: 'kmh',
      visibility: 'good',
      recordedAt: new Date(),
      isAutoFetched: true,
    };
    
    setValue(fieldName, mockWeatherData);
    setIsFetching(false);
  }, [fieldName, setValue]);

  // Get temperature display
  const getTemperatureDisplay = (): string => {
    if (!currentValue) return '';
    return `${currentValue.temperature}°${currentValue.temperatureUnit}`;
  };

  // Get weather condition info
  const getWeatherConditionInfo = (condition: WeatherCondition) => {
    return WEATHER_CONDITIONS[condition];
  };

  if (!currentValue) return null;

  const conditionInfo = getWeatherConditionInfo(currentValue.condition);
  const IconComponent = conditionInfo.icon;

  return (
    <Field
      label={block.label}
      required={block.required}
      error={error?.message}
      hint={block.config?.hint || 'Record weather conditions for this activity'}
      blockType="weather"
      id={`weather-${block.id}`}
    >
      <div className="space-y-4">
        {/* Fetch current weather button */}
        <div className="flex justify-between items-center">
          <div className="text-sm font-medium">Weather Conditions</div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fetchCurrentWeather}
            disabled={isFetching}
            className="text-xs flex items-center gap-1"
          >
            <RefreshCw className={`w-3 h-3 ${isFetching ? 'animate-spin' : ''}`} />
            {isFetching ? 'Fetching...' : 'Get Current'}
          </Button>
        </div>

        {/* Weather condition selector */}
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(WEATHER_CONDITIONS).map(([condition, config]) => {
            const Icon = config.icon;
            const isSelected = currentValue.condition === condition;
            
            return (
              <Button
                key={condition}
                type="button"
                variant={isSelected ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFieldChange('condition', condition as WeatherCondition)}
                className="flex flex-col items-center gap-1 h-auto p-2 text-xs"
              >
                <Icon className={`w-4 h-4 ${isSelected ? '' : config.color}`} />
                <span>{config.label}</span>
              </Button>
            );
          })}
        </div>

        {/* Temperature */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium flex items-center gap-1">
              <Thermometer className="w-3 h-3" />
              Temperature
            </label>
            <div className="mt-1 flex gap-1">
              <Input
                type="number"
                value={currentValue.temperature}
                onChange={(e) => handleFieldChange('temperature', parseInt(e.target.value) || 0)}
                className="text-center"
              />
              <Select 
                value={currentValue.temperatureUnit} 
                onValueChange={(value) => handleTemperatureUnitChange(value as 'C' | 'F')}
              >
                <SelectTrigger className="w-16">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="C">°C</SelectItem>
                  <SelectItem value="F">°F</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium flex items-center gap-1">
              <Wind className="w-3 h-3" />
              Wind Speed
            </label>
            <div className="mt-1 flex gap-1">
              <Input
                type="number"
                min={0}
                value={currentValue.windSpeed || ''}
                onChange={(e) => handleFieldChange('windSpeed', parseInt(e.target.value) || undefined)}
                placeholder="0"
                className="text-center"
              />
              <Select 
                value={currentValue.windUnit} 
                onValueChange={(value) => handleFieldChange('windUnit', value as 'kmh' | 'mph')}
              >
                <SelectTrigger className="w-16">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kmh">km/h</SelectItem>
                  <SelectItem value="mph">mph</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Advanced options toggle */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full text-xs"
        >
          {showAdvanced ? 'Less Options' : 'More Options'}
        </Button>

        {/* Advanced weather options */}
        {showAdvanced && (
          <div className="space-y-3 border-t pt-3">
            {/* Humidity */}
            <div>
              <label className="text-sm font-medium flex items-center gap-1">
                <Droplets className="w-3 h-3" />
                Humidity (%)
              </label>
              <Input
                type="number"
                min={0}
                max={100}
                value={currentValue.humidity || ''}
                onChange={(e) => handleFieldChange('humidity', parseInt(e.target.value) || undefined)}
                placeholder="Enter humidity percentage"
                className="mt-1"
              />
            </div>

            {/* Visibility */}
            <div>
              <label className="text-sm font-medium flex items-center gap-1">
                <Eye className="w-3 h-3" />
                Visibility
              </label>
              <Select 
                value={currentValue.visibility || ''} 
                onValueChange={(value) => handleFieldChange('visibility', value || undefined)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(VISIBILITY_OPTIONS).map(([key, option]) => (
                    <SelectItem key={key} value={key}>
                      <div>
                        <div>{option.label}</div>
                        <div className="text-xs text-muted-foreground">{option.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Weather summary */}
        <div className="bg-primary/5 border border-primary/20 rounded-md p-3">
          <div className="flex items-center gap-2">
            <IconComponent className={`w-5 h-5 ${conditionInfo.color}`} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{conditionInfo.label}</span>
                <Badge variant="outline" className="text-xs">
                  {getTemperatureDisplay()}
                </Badge>
                {currentValue.windSpeed && (
                  <Badge variant="secondary" className="text-xs">
                    <Wind className="w-3 h-3 mr-1" />
                    {currentValue.windSpeed} {currentValue.windUnit}
                  </Badge>
                )}
              </div>
              
              <div className="text-xs text-muted-foreground mt-1">
                Recorded: {currentValue.recordedAt.toLocaleString()}
                {currentValue.isAutoFetched && (
                  <span className="ml-1">(Auto-fetched)</span>
                )}
              </div>

              {/* Additional details */}
              {(currentValue.humidity || currentValue.visibility) && (
                <div className="flex gap-2 mt-2">
                  {currentValue.humidity && (
                    <Badge variant="outline" className="text-xs">
                      <Droplets className="w-3 h-3 mr-1" />
                      {currentValue.humidity}%
                    </Badge>
                  )}
                  {currentValue.visibility && (
                    <Badge variant="outline" className="text-xs">
                      <Eye className="w-3 h-3 mr-1" />
                      {VISIBILITY_OPTIONS[currentValue.visibility].label}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Weather notes */}
        <div>
          <label className="text-sm font-medium">Weather Notes (Optional)</label>
          <Input
            type="text"
            placeholder="Any additional weather observations..."
            value={currentValue.notes || ''}
            onChange={(e) => handleFieldChange('notes', e.target.value)}
            className="mt-1"
          />
        </div>
      </div>
    </Field>
  );
};

export default WeatherBlock;