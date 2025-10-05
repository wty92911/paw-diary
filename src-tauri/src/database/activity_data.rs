use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// Typed activity data structures for core activity types.
/// This replaces the generic `serde_json::Value` with strongly-typed enums
/// to enable type safety, query optimization, and analytics capabilities.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "type", content = "data")]
pub enum ActivityData {
    /// Weight measurement activity (Growth category)
    /// Automatically updates Pet.weight_kg when created
    Weight {
        value: f32,
        unit: String,
        measurement_type: String,
        notes: Option<String>,
    },

    /// Height/Length measurement activity (Growth category)
    /// Can be used for tracking growth in young pets
    Height {
        value: f32,
        unit: String,
        measurement_type: String,
        notes: Option<String>,
    },

    /// Feeding activity (Diet category)
    /// Used for meal tracking and portion analysis
    Feeding {
        portion_type: String,
        amount: f32,
        unit: String,
        brand: Option<String>,
        notes: Option<String>,
    },

    /// Water intake activity (Diet category)
    /// Track daily hydration
    WaterIntake {
        amount: f32,
        unit: String,
        source: Option<String>,
        notes: Option<String>,
    },

    /// Vaccination record (Health category)
    /// Track vaccination history and schedule
    Vaccination {
        vaccine_name: String,
        vet_name: Option<String>,
        next_due_date: Option<DateTime<Utc>>,
        batch_number: Option<String>,
        notes: Option<String>,
    },

    /// Health check-up (Health category)
    /// Veterinary visit records
    CheckUp {
        diagnosis: Option<String>,
        temperature: Option<f32>,
        heart_rate: Option<i32>,
        notes: Option<String>,
    },

    /// Fallback for unknown or custom activity templates
    /// Preserves backward compatibility and allows new templates without code changes
    Custom(serde_json::Value),
}

impl ActivityData {
    /// Migrate legacy JSON data to typed ActivityData
    /// This function attempts to parse untyped JSON into strongly-typed variants
    pub fn from_legacy_json(value: serde_json::Value) -> Self {
        // Try to parse as typed ActivityData first (handles new format)
        if let Ok(typed) = serde_json::from_value::<ActivityData>(value.clone()) {
            return typed;
        }

        // Attempt to migrate known patterns from frontend block structure
        if let Some(obj) = value.as_object() {
            // Pattern 1: Weight measurement from MeasurementBlock
            // Frontend sends: { "weight": { "value": 5.2, "unit": "kg", ... }, "notes": "..." }
            if let Some(weight_block) = obj.get("weight").and_then(|v| v.as_object()) {
                if let (Some(value), Some(unit)) = (
                    weight_block.get("value").and_then(|v| v.as_f64()),
                    weight_block.get("unit").and_then(|v| v.as_str()),
                ) {
                    let measurement_type = weight_block
                        .get("measurementType")
                        .and_then(|v| v.as_str())
                        .unwrap_or("weight")
                        .to_string();

                    let notes = obj.get("notes").and_then(|v| v.as_str()).map(String::from);

                    return ActivityData::Weight {
                        value: value as f32,
                        unit: unit.to_string(),
                        measurement_type,
                        notes,
                    };
                }
            }

            // Pattern 2: Height measurement from MeasurementBlock
            if let Some(height_block) = obj.get("height").and_then(|v| v.as_object()) {
                if let (Some(value), Some(unit)) = (
                    height_block.get("value").and_then(|v| v.as_f64()),
                    height_block.get("unit").and_then(|v| v.as_str()),
                ) {
                    let measurement_type = height_block
                        .get("measurementType")
                        .and_then(|v| v.as_str())
                        .unwrap_or("height")
                        .to_string();

                    let notes = obj.get("notes").and_then(|v| v.as_str()).map(String::from);

                    return ActivityData::Height {
                        value: value as f32,
                        unit: unit.to_string(),
                        measurement_type,
                        notes,
                    };
                }
            }

            // Pattern 3: Feeding from PortionBlock
            // Frontend sends: { "portion": { "amount": 200, "unit": "g", "portionType": "meal", ... }, "notes": "..." }
            if let Some(portion_block) = obj.get("portion").and_then(|v| v.as_object()) {
                if let (Some(amount), Some(unit), Some(portion_type)) = (
                    portion_block.get("amount").and_then(|v| v.as_f64()),
                    portion_block.get("unit").and_then(|v| v.as_str()),
                    portion_block.get("portionType").and_then(|v| v.as_str()),
                ) {
                    let brand = portion_block
                        .get("brand")
                        .and_then(|v| v.as_str())
                        .map(String::from);

                    let notes = obj.get("notes").and_then(|v| v.as_str()).map(String::from);

                    return ActivityData::Feeding {
                        portion_type: portion_type.to_string(),
                        amount: amount as f32,
                        unit: unit.to_string(),
                        brand,
                        notes,
                    };
                }
            }

            // Pattern 4: Water intake (special case of portion with water-specific subcategory)
            // Check subcategory context if available (passed from outer Activity struct)
            if let Some(portion_block) = obj.get("portion").and_then(|v| v.as_object()) {
                // This pattern relies on the subcategory being "Water" - handled at Activity level
                // For now, we can check if portion_type indicates water
                if let Some(portion_type) =
                    portion_block.get("portionType").and_then(|v| v.as_str())
                {
                    if portion_type == "bowl"
                        || portion_type == "bottle"
                        || portion_type == "fountain"
                    {
                        if let (Some(amount), Some(unit)) = (
                            portion_block.get("amount").and_then(|v| v.as_f64()),
                            portion_block.get("unit").and_then(|v| v.as_str()),
                        ) {
                            let source = Some(portion_type.to_string());
                            let notes = obj.get("notes").and_then(|v| v.as_str()).map(String::from);

                            // Note: This heuristic might need refinement with subcategory context
                            return ActivityData::WaterIntake {
                                amount: amount as f32,
                                unit: unit.to_string(),
                                source,
                                notes,
                            };
                        }
                    }
                }
            }
        }

        // Ultimate fallback: preserve as custom data
        ActivityData::Custom(value)
    }

    /// Convert ActivityData back to frontend block format
    /// This maintains compatibility with the frontend template system
    pub fn to_frontend_blocks(&self) -> serde_json::Value {
        match self {
            ActivityData::Weight {
                value,
                unit,
                measurement_type,
                notes,
            } => {
                let mut blocks = serde_json::json!({
                    "weight": {
                        "value": value,
                        "unit": unit,
                        "measurementType": measurement_type,
                    }
                });

                if let Some(notes_text) = notes {
                    blocks["notes"] = serde_json::json!(notes_text);
                }

                blocks
            }

            ActivityData::Height {
                value,
                unit,
                measurement_type,
                notes,
            } => {
                let mut blocks = serde_json::json!({
                    "height": {
                        "value": value,
                        "unit": unit,
                        "measurementType": measurement_type,
                    }
                });

                if let Some(notes_text) = notes {
                    blocks["notes"] = serde_json::json!(notes_text);
                }

                blocks
            }

            ActivityData::Feeding {
                portion_type,
                amount,
                unit,
                brand,
                notes,
            } => {
                let mut portion = serde_json::json!({
                    "amount": amount,
                    "unit": unit,
                    "portionType": portion_type,
                });

                if let Some(brand_name) = brand {
                    portion["brand"] = serde_json::json!(brand_name);
                }

                let mut blocks = serde_json::json!({
                    "portion": portion
                });

                if let Some(notes_text) = notes {
                    blocks["notes"] = serde_json::json!(notes_text);
                }

                blocks
            }

            ActivityData::WaterIntake {
                amount,
                unit,
                source,
                notes,
            } => {
                let mut portion = serde_json::json!({
                    "amount": amount,
                    "unit": unit,
                });

                if let Some(source_type) = source {
                    portion["portionType"] = serde_json::json!(source_type);
                }

                let mut blocks = serde_json::json!({
                    "portion": portion
                });

                if let Some(notes_text) = notes {
                    blocks["notes"] = serde_json::json!(notes_text);
                }

                blocks
            }

            ActivityData::Vaccination {
                vaccine_name,
                vet_name,
                next_due_date,
                batch_number,
                notes,
            } => {
                let mut blocks = serde_json::json!({
                    "vaccination": {
                        "vaccine_name": vaccine_name,
                    }
                });

                if let Some(vet) = vet_name {
                    blocks["vaccination"]["vet_name"] = serde_json::json!(vet);
                }

                if let Some(due_date) = next_due_date {
                    blocks["vaccination"]["next_due_date"] = serde_json::json!(due_date);
                }

                if let Some(batch) = batch_number {
                    blocks["vaccination"]["batch_number"] = serde_json::json!(batch);
                }

                if let Some(notes_text) = notes {
                    blocks["notes"] = serde_json::json!(notes_text);
                }

                blocks
            }

            ActivityData::CheckUp {
                diagnosis,
                temperature,
                heart_rate,
                notes,
            } => {
                let mut blocks = serde_json::json!({
                    "checkup": {}
                });

                if let Some(diag) = diagnosis {
                    blocks["checkup"]["diagnosis"] = serde_json::json!(diag);
                }

                if let Some(temp) = temperature {
                    blocks["checkup"]["temperature"] = serde_json::json!(temp);
                }

                if let Some(hr) = heart_rate {
                    blocks["checkup"]["heart_rate"] = serde_json::json!(hr);
                }

                if let Some(notes_text) = notes {
                    blocks["notes"] = serde_json::json!(notes_text);
                }

                blocks
            }

            ActivityData::Custom(value) => value.clone(),
        }
    }

    /// Helper: Check if this activity should trigger pet profile updates
    pub fn should_update_pet_profile(&self) -> bool {
        matches!(
            self,
            ActivityData::Weight { .. } | ActivityData::Height { .. }
        )
    }

    /// Helper: Get weight value in kilograms (for pet profile update)
    pub fn extract_weight_kg(&self) -> Option<f32> {
        match self {
            ActivityData::Weight { value, unit, .. } => Some(convert_weight_to_kg(*value, unit)),
            _ => None,
        }
    }
}

/// Convert weight to kilograms for standardized storage
fn convert_weight_to_kg(value: f32, unit: &str) -> f32 {
    match unit.to_lowercase().as_str() {
        "kg" => value,
        "g" => value / 1000.0,
        "lbs" | "lb" => value / 2.205,
        "oz" => value / 35.274,
        _ => value, // Unknown unit, assume kg
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_weight_serialization() {
        let weight = ActivityData::Weight {
            value: 5.2,
            unit: "kg".to_string(),
            measurement_type: "weight".to_string(),
            notes: Some("Healthy weight".to_string()),
        };

        let json = serde_json::to_value(&weight).unwrap();
        assert_eq!(json["type"], "Weight");
        // Use approximate comparison for floating point
        let value = json["data"]["value"].as_f64().unwrap();
        assert!((value - 5.2).abs() < 0.01, "Expected ~5.2, got {value}");
        assert_eq!(json["data"]["unit"], "kg");
    }

    #[test]
    fn test_weight_deserialization() {
        let json = json!({
            "type": "Weight",
            "data": {
                "value": 5.2,
                "unit": "kg",
                "measurement_type": "weight",
                "notes": "Healthy weight"
            }
        });

        let data: ActivityData = serde_json::from_value(json).unwrap();
        match data {
            ActivityData::Weight { value, unit, .. } => {
                assert_eq!(value, 5.2);
                assert_eq!(unit, "kg");
            }
            _ => panic!("Expected Weight variant"),
        }
    }

    #[test]
    fn test_legacy_weight_migration() {
        let legacy_json = json!({
            "weight": {
                "value": 5.2,
                "unit": "kg",
                "measurementType": "weight"
            },
            "notes": "Healthy weight"
        });

        let data = ActivityData::from_legacy_json(legacy_json);
        match data {
            ActivityData::Weight {
                value, unit, notes, ..
            } => {
                assert_eq!(value, 5.2);
                assert_eq!(unit, "kg");
                assert_eq!(notes.unwrap(), "Healthy weight");
            }
            _ => panic!("Expected Weight variant"),
        }
    }

    #[test]
    fn test_legacy_feeding_migration() {
        let legacy_json = json!({
            "portion": {
                "amount": 200.0,
                "unit": "g",
                "portionType": "meal",
                "brand": "Royal Canin"
            },
            "notes": "Evening meal"
        });

        let data = ActivityData::from_legacy_json(legacy_json);
        match data {
            ActivityData::Feeding {
                amount,
                unit,
                brand,
                notes,
                ..
            } => {
                assert_eq!(amount, 200.0);
                assert_eq!(unit, "g");
                assert_eq!(brand.unwrap(), "Royal Canin");
                assert_eq!(notes.unwrap(), "Evening meal");
            }
            _ => panic!("Expected Feeding variant"),
        }
    }

    #[test]
    fn test_custom_fallback() {
        let unknown_json = json!({
            "some_custom_field": "value",
            "another_field": 123
        });

        let data = ActivityData::from_legacy_json(unknown_json.clone());
        match data {
            ActivityData::Custom(value) => {
                assert_eq!(value, unknown_json);
            }
            _ => panic!("Expected Custom variant"),
        }
    }

    #[test]
    fn test_weight_conversion() {
        assert_eq!(convert_weight_to_kg(5.0, "kg"), 5.0);
        assert_eq!(convert_weight_to_kg(5000.0, "g"), 5.0);
        assert_eq!(convert_weight_to_kg(11.025, "lbs"), 5.0);
    }

    #[test]
    fn test_extract_weight_kg() {
        let weight = ActivityData::Weight {
            value: 5000.0,
            unit: "g".to_string(),
            measurement_type: "weight".to_string(),
            notes: None,
        };

        assert_eq!(weight.extract_weight_kg(), Some(5.0));
    }

    #[test]
    fn test_to_frontend_blocks() {
        let weight = ActivityData::Weight {
            value: 5.2,
            unit: "kg".to_string(),
            measurement_type: "weight".to_string(),
            notes: Some("Test".to_string()),
        };

        let blocks = weight.to_frontend_blocks();
        // Use approximate comparison for floating point
        let value = blocks["weight"]["value"].as_f64().unwrap();
        assert!((value - 5.2).abs() < 0.01, "Expected ~5.2, got {value}");
        assert_eq!(blocks["weight"]["unit"], "kg");
        assert_eq!(blocks["notes"], "Test");
    }
}
