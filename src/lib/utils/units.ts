// Unit conversion utilities for measurement and portion blocks

export interface UnitDefinition {
  id: string;
  label: string;
  symbol: string;
  category: 'volume' | 'weight' | 'length' | 'temperature' | 'count' | 'serving';
  baseUnit?: string; // Reference unit for conversion
  conversionFactor?: number; // Factor to convert to base unit
  isBaseUnit?: boolean;
}

// Comprehensive unit definitions with conversion factors
export const UNIT_DEFINITIONS: Record<string, UnitDefinition> = {
  // Volume Units (base: ml)
  'ml': { 
    id: 'ml', 
    label: 'Milliliter', 
    symbol: 'ml', 
    category: 'volume', 
    isBaseUnit: true 
  },
  'l': { 
    id: 'l', 
    label: 'Liter', 
    symbol: 'L', 
    category: 'volume', 
    baseUnit: 'ml', 
    conversionFactor: 1000 
  },
  'cup': { 
    id: 'cup', 
    label: 'Cup', 
    symbol: 'c', 
    category: 'volume', 
    baseUnit: 'ml', 
    conversionFactor: 236.588 
  },
  'fl_oz': { 
    id: 'fl_oz', 
    label: 'Fluid Ounce', 
    symbol: 'fl oz', 
    category: 'volume', 
    baseUnit: 'ml', 
    conversionFactor: 29.5735 
  },
  'tbsp': { 
    id: 'tbsp', 
    label: 'Tablespoon', 
    symbol: 'tbsp', 
    category: 'volume', 
    baseUnit: 'ml', 
    conversionFactor: 14.7868 
  },
  'tsp': { 
    id: 'tsp', 
    label: 'Teaspoon', 
    symbol: 'tsp', 
    category: 'volume', 
    baseUnit: 'ml', 
    conversionFactor: 4.92892 
  },
  'pt': { 
    id: 'pt', 
    label: 'Pint', 
    symbol: 'pt', 
    category: 'volume', 
    baseUnit: 'ml', 
    conversionFactor: 473.176 
  },
  'qt': { 
    id: 'qt', 
    label: 'Quart', 
    symbol: 'qt', 
    category: 'volume', 
    baseUnit: 'ml', 
    conversionFactor: 946.353 
  },

  // Weight Units (base: g)
  'g': { 
    id: 'g', 
    label: 'Gram', 
    symbol: 'g', 
    category: 'weight', 
    isBaseUnit: true 
  },
  'kg': { 
    id: 'kg', 
    label: 'Kilogram', 
    symbol: 'kg', 
    category: 'weight', 
    baseUnit: 'g', 
    conversionFactor: 1000 
  },
  'mg': { 
    id: 'mg', 
    label: 'Milligram', 
    symbol: 'mg', 
    category: 'weight', 
    baseUnit: 'g', 
    conversionFactor: 0.001 
  },
  'oz': { 
    id: 'oz', 
    label: 'Ounce', 
    symbol: 'oz', 
    category: 'weight', 
    baseUnit: 'g', 
    conversionFactor: 28.3495 
  },
  'lb': { 
    id: 'lb', 
    label: 'Pound', 
    symbol: 'lb', 
    category: 'weight', 
    baseUnit: 'g', 
    conversionFactor: 453.592 
  },

  // Length Units (base: cm)
  'cm': { 
    id: 'cm', 
    label: 'Centimeter', 
    symbol: 'cm', 
    category: 'length', 
    isBaseUnit: true 
  },
  'm': { 
    id: 'm', 
    label: 'Meter', 
    symbol: 'm', 
    category: 'length', 
    baseUnit: 'cm', 
    conversionFactor: 100 
  },
  'mm': { 
    id: 'mm', 
    label: 'Millimeter', 
    symbol: 'mm', 
    category: 'length', 
    baseUnit: 'cm', 
    conversionFactor: 0.1 
  },
  'in': { 
    id: 'in', 
    label: 'Inch', 
    symbol: 'in', 
    category: 'length', 
    baseUnit: 'cm', 
    conversionFactor: 2.54 
  },
  'ft': { 
    id: 'ft', 
    label: 'Foot', 
    symbol: 'ft', 
    category: 'length', 
    baseUnit: 'cm', 
    conversionFactor: 30.48 
  },

  // Temperature Units (base: celsius)
  'celsius': { 
    id: 'celsius', 
    label: 'Celsius', 
    symbol: '°C', 
    category: 'temperature', 
    isBaseUnit: true 
  },
  'fahrenheit': { 
    id: 'fahrenheit', 
    label: 'Fahrenheit', 
    symbol: '°F', 
    category: 'temperature', 
    baseUnit: 'celsius' 
  },

  // Count Units (no conversion)
  'piece': { 
    id: 'piece', 
    label: 'Piece', 
    symbol: 'pcs', 
    category: 'count' 
  },
  'treat': { 
    id: 'treat', 
    label: 'Treat', 
    symbol: 'treats', 
    category: 'count' 
  },
  'kibble': { 
    id: 'kibble', 
    label: 'Kibble', 
    symbol: 'kibbles', 
    category: 'count' 
  },
  'tablet': { 
    id: 'tablet', 
    label: 'Tablet', 
    symbol: 'tabs', 
    category: 'count' 
  },
  'capsule': { 
    id: 'capsule', 
    label: 'Capsule', 
    symbol: 'caps', 
    category: 'count' 
  },

  // Serving Units (no conversion)
  'portion': { 
    id: 'portion', 
    label: 'Portion', 
    symbol: 'portions', 
    category: 'serving' 
  },
  'meal': { 
    id: 'meal', 
    label: 'Meal', 
    symbol: 'meals', 
    category: 'serving' 
  },
  'serving': { 
    id: 'serving', 
    label: 'Serving', 
    symbol: 'servings', 
    category: 'serving' 
  },
  'bowl': { 
    id: 'bowl', 
    label: 'Bowl', 
    symbol: 'bowls', 
    category: 'serving' 
  },
  'scoop': { 
    id: 'scoop', 
    label: 'Scoop', 
    symbol: 'scoops', 
    category: 'serving' 
  },
};

// Unit preference storage key
const UNIT_PREFERENCES_KEY = 'paw-diary-unit-preferences';

// Unit preferences interface
export interface UnitPreferences {
  defaultUnits: Record<string, string>; // category -> preferred unit
  petSpecificUnits: Record<number, Record<string, string>>; // petId -> category -> unit
}

// Load unit preferences from localStorage
function loadUnitPreferences(): UnitPreferences {
  try {
    const stored = localStorage.getItem(UNIT_PREFERENCES_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('Failed to load unit preferences:', error);
  }

  return {
    defaultUnits: {
      volume: 'cup',
      weight: 'g',
      length: 'cm',
      temperature: 'celsius',
    },
    petSpecificUnits: {},
  };
}

// Save unit preferences to localStorage
function saveUnitPreferences(preferences: UnitPreferences): void {
  try {
    localStorage.setItem(UNIT_PREFERENCES_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.warn('Failed to save unit preferences:', error);
  }
}

// Global unit preferences
let unitPreferences = loadUnitPreferences();

// Unit conversion functions
export function convertUnits(
  value: number,
  fromUnitId: string,
  toUnitId: string
): number | null {
  const fromUnit = UNIT_DEFINITIONS[fromUnitId];
  const toUnit = UNIT_DEFINITIONS[toUnitId];

  if (!fromUnit || !toUnit) {
    console.warn(`Unknown unit: ${fromUnitId} or ${toUnitId}`);
    return null;
  }

  // Same unit, no conversion needed
  if (fromUnitId === toUnitId) {
    return value;
  }

  // Different categories, can't convert
  if (fromUnit.category !== toUnit.category) {
    console.warn(`Cannot convert between different categories: ${fromUnit.category} to ${toUnit.category}`);
    return null;
  }

  // Special case: temperature conversion
  if (fromUnit.category === 'temperature') {
    return convertTemperature(value, fromUnitId as 'celsius' | 'fahrenheit', toUnitId as 'celsius' | 'fahrenheit');
  }

  // Count and serving units don't convert between each other
  if (fromUnit.category === 'count' || fromUnit.category === 'serving') {
    return fromUnitId === toUnitId ? value : null;
  }

  // Convert via base unit
  const fromBaseValue = convertToBaseUnit(value, fromUnit);
  if (fromBaseValue === null) return null;

  return convertFromBaseUnit(fromBaseValue, toUnit);
}

// Convert temperature between Celsius and Fahrenheit
function convertTemperature(
  value: number, 
  fromUnit: 'celsius' | 'fahrenheit', 
  toUnit: 'celsius' | 'fahrenheit'
): number {
  if (fromUnit === toUnit) return value;

  if (fromUnit === 'celsius' && toUnit === 'fahrenheit') {
    return (value * 9/5) + 32;
  } else if (fromUnit === 'fahrenheit' && toUnit === 'celsius') {
    return (value - 32) * 5/9;
  }

  return value;
}

// Convert value to base unit
function convertToBaseUnit(value: number, unit: UnitDefinition): number | null {
  if (unit.isBaseUnit) {
    return value;
  }

  if (!unit.conversionFactor) {
    return null;
  }

  return value * unit.conversionFactor;
}

// Convert value from base unit
function convertFromBaseUnit(baseValue: number, unit: UnitDefinition): number | null {
  if (unit.isBaseUnit) {
    return baseValue;
  }

  if (!unit.conversionFactor) {
    return null;
  }

  return baseValue / unit.conversionFactor;
}

// Get units for a category
export function getUnitsForCategory(category: string): UnitDefinition[] {
  return Object.values(UNIT_DEFINITIONS).filter(unit => unit.category === category);
}

// Get unit definition by ID
export function getUnitDefinition(unitId: string): UnitDefinition | undefined {
  return UNIT_DEFINITIONS[unitId];
}

// Unit preference functions
export function getPreferredUnit(category: string, petId?: number): string {
  if (petId && unitPreferences.petSpecificUnits[petId]?.[category]) {
    return unitPreferences.petSpecificUnits[petId][category];
  }

  return unitPreferences.defaultUnits[category] || Object.values(UNIT_DEFINITIONS)
    .find(unit => unit.category === category && unit.isBaseUnit)?.id || '';
}

export function setPreferredUnit(category: string, unitId: string, petId?: number): void {
  if (petId) {
    if (!unitPreferences.petSpecificUnits[petId]) {
      unitPreferences.petSpecificUnits[petId] = {};
    }
    unitPreferences.petSpecificUnits[petId][category] = unitId;
  } else {
    unitPreferences.defaultUnits[category] = unitId;
  }

  saveUnitPreferences(unitPreferences);
}

export function clearUnitPreferences(petId?: number): void {
  if (petId) {
    delete unitPreferences.petSpecificUnits[petId];
  } else {
    unitPreferences = {
      defaultUnits: {
        volume: 'cup',
        weight: 'g',
        length: 'cm',
        temperature: 'celsius',
      },
      petSpecificUnits: {},
    };
  }

  saveUnitPreferences(unitPreferences);
}

// Format value with unit
export function formatValueWithUnit(
  value: number, 
  unitId: string, 
  options?: {
    decimals?: number;
    showSymbol?: boolean;
    showLabel?: boolean;
  }
): string {
  const unit = UNIT_DEFINITIONS[unitId];
  if (!unit) return value.toString();

  const { decimals = 2, showSymbol = true, showLabel = false } = options || {};
  const formattedValue = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();
  
  if (showLabel) {
    return `${formattedValue} ${unit.label}${value !== 1 ? 's' : ''}`;
  } else if (showSymbol) {
    return `${formattedValue} ${unit.symbol}`;
  } else {
    return formattedValue;
  }
}

// Smart unit conversion for display
export function convertToDisplayUnit(
  value: number,
  currentUnitId: string,
  category: string,
  petId?: number
): { value: number; unitId: string } | null {
  const preferredUnitId = getPreferredUnit(category, petId);
  
  if (currentUnitId === preferredUnitId) {
    return { value, unitId: currentUnitId };
  }

  const convertedValue = convertUnits(value, currentUnitId, preferredUnitId);
  if (convertedValue === null) {
    return { value, unitId: currentUnitId };
  }

  return { value: convertedValue, unitId: preferredUnitId };
}

// Auto-convert to best display unit (e.g., 1000g -> 1kg)
export function convertToOptimalDisplayUnit(
  value: number,
  unitId: string
): { value: number; unitId: string } {
  const unit = UNIT_DEFINITIONS[unitId];
  if (!unit) return { value, unitId };

  const category = unit.category;
  
  // Rules for optimal display units
  if (category === 'weight') {
    if (unitId === 'g' && value >= 1000) {
      const kgValue = convertUnits(value, 'g', 'kg');
      if (kgValue !== null && kgValue >= 1) {
        return { value: kgValue, unitId: 'kg' };
      }
    } else if (unitId === 'mg' && value >= 1000) {
      const gValue = convertUnits(value, 'mg', 'g');
      if (gValue !== null && gValue >= 1) {
        return { value: gValue, unitId: 'g' };
      }
    }
  } else if (category === 'volume') {
    if (unitId === 'ml' && value >= 1000) {
      const lValue = convertUnits(value, 'ml', 'l');
      if (lValue !== null && lValue >= 1) {
        return { value: lValue, unitId: 'l' };
      }
    } else if (unitId === 'tsp' && value >= 3) {
      const tbspValue = convertUnits(value, 'tsp', 'tbsp');
      if (tbspValue !== null && tbspValue >= 1) {
        return { value: tbspValue, unitId: 'tbsp' };
      }
    }
  } else if (category === 'length') {
    if (unitId === 'mm' && value >= 10) {
      const cmValue = convertUnits(value, 'mm', 'cm');
      if (cmValue !== null && cmValue >= 1) {
        return { value: cmValue, unitId: 'cm' };
      }
    } else if (unitId === 'cm' && value >= 100) {
      const mValue = convertUnits(value, 'cm', 'm');
      if (mValue !== null && mValue >= 1) {
        return { value: mValue, unitId: 'm' };
      }
    }
  }

  return { value, unitId };
}

// Export unit preferences for external access
export function getUnitPreferences(): UnitPreferences {
  return { ...unitPreferences };
}

// Reload preferences from storage (useful after external changes)
export function reloadUnitPreferences(): void {
  unitPreferences = loadUnitPreferences();
}