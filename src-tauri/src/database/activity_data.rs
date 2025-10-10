use serde::{Deserialize, Deserializer, Serialize};
use std::collections::HashMap;

/// Custom deserializer that accepts both number and string, converts to string
fn deserialize_number_to_string<'de, D>(deserializer: D) -> Result<String, D::Error>
where
    D: Deserializer<'de>,
{
    #[derive(Deserialize)]
    #[serde(untagged)]
    enum NumOrString {
        Num(f64),
        Str(String),
    }

    match NumOrString::deserialize(deserializer)? {
        NumOrString::Num(n) => {
            // Convert number to string, preserving precision
            // Remove trailing zeros and unnecessary decimal point
            let s = n.to_string();
            Ok(s)
        }
        NumOrString::Str(s) => Ok(s),
    }
}

/// Individual block data - matches frontend block structure
/// Each block type (time, notes, portion, measurement, etc.) is stored as a separate value
///
/// Deserialization strategy with untagged enum:
/// - Serde tries variants in order until one succeeds
/// - Order matters! More specific variants should come first
/// - Time: requires "date" field (unique identifier)
/// - Portion: requires "portionType" field (unique identifier)
/// - Measurement: requires "measurementType" field (unique identifier)
/// - Text: fallback for simple strings
/// - Other: fallback for any JSON value
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(untagged)]
pub enum BlockData {
    /// Time block: { date: "ISO string", time: "", timezone: "..." }
    /// Uniquely identified by "date" field
    Time {
        date: String,
        #[serde(default)]
        time: String,
        #[serde(default)]
        timezone: String,
    },

    /// Portion block: { amount: 0.75, unit: "ml", portionType: "bowl", brand: "..." }
    /// Uniquely identified by "portionType" field
    Portion {
        amount: f32,
        unit: String,
        #[serde(rename = "portionType")]
        portion_type: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        brand: Option<String>,
        product: Option<String>,
    },

    /// Measurement block (weight, height): { value: 5.2, unit: "kg", measurementType: "weight" }
    /// Uniquely identified by "measurementType" field
    /// Value is stored as string in database but accepts both number and string from frontend
    Measurement {
        #[serde(deserialize_with = "deserialize_number_to_string")]
        value: String,
        unit: String,
        #[serde(rename = "measurementType")]
        measurement_type: String,
    },

    /// Notes or Title block: simple string
    /// Matches any string value
    Text(String),

    /// Generic value for other block types
    /// Fallback for any JSON structure
    Other(serde_json::Value),
}

/// Activity data structure - a map of block type to block data
/// Frontend sends: { "time": {...}, "notes": "...", "portion": {...} }
/// This matches the frontend blocks structure exactly
pub type ActivityData = HashMap<String, BlockData>;

/// Helper methods for ActivityData
pub trait ActivityDataExt {
    /// Check if this activity should update the pet profile
    fn should_update_pet_profile(&self) -> bool;

    /// Extract weight value in kg for pet profile updates
    fn extract_weight_kg(&self) -> Option<f32>;

    /// Convert to frontend-compatible format (passthrough for HashMap)
    fn to_frontend_blocks(&self) -> serde_json::Value;

    /// Create ActivityData from frontend JSON
    fn from_legacy_json(value: serde_json::Value) -> Self;
}

impl ActivityDataExt for ActivityData {
    fn should_update_pet_profile(&self) -> bool {
        // Check if this contains a weight measurement
        self.get("weight").is_some()
    }

    fn extract_weight_kg(&self) -> Option<f32> {
        // Extract weight value from measurement block
        if let Some(BlockData::Measurement { value, unit, .. }) = self.get("weight") {
            // Parse string value to f32
            let parsed_value = value.parse::<f32>().ok()?;

            // Convert to kg if needed
            match unit.to_lowercase().as_str() {
                "kg" => Some(parsed_value),
                "g" => Some(parsed_value / 1000.0),
                "lb" | "lbs" => Some(parsed_value * 0.453592),
                _ => Some(parsed_value), // Assume kg if unknown
            }
        } else {
            None
        }
    }

    fn to_frontend_blocks(&self) -> serde_json::Value {
        // ActivityData is already in frontend format (HashMap<String, BlockData>)
        // Just serialize it directly
        serde_json::to_value(self).unwrap_or(serde_json::Value::Null)
    }

    fn from_legacy_json(value: serde_json::Value) -> Self {
        // Try to deserialize directly as HashMap<String, BlockData>
        if let Ok(map) = serde_json::from_value::<ActivityData>(value.clone()) {
            return map;
        }

        // Fallback: create empty map if deserialization fails
        log::warn!("[ActivityData] Failed to deserialize blocks, using empty map");
        HashMap::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_feeding_activity_deserialization() {
        let json = serde_json::json!({
            "title": "Breakfast",
            "time": {
                "date": "2025-10-02T11:19:00.000Z",
                "time": "",
                "timezone": "Asia/Shanghai"
            },
            "portion": {
                "amount": 0.75,
                "unit": "ml",
                "portionType": "bowl",
                "brand": "Purina Pro Plan",
                "product": "Normal"
            },
            "notes": "Ate well"
        });

        let activity_data = ActivityData::from_legacy_json(json);

        // Verify structure
        assert!(activity_data.contains_key("title"));
        assert!(activity_data.contains_key("time"));
        assert!(activity_data.contains_key("portion"));
        assert!(activity_data.contains_key("notes"));

        // Verify portion data
        if let Some(BlockData::Portion {
            amount,
            unit,
            portion_type,
            brand,
            product,
        }) = activity_data.get("portion")
        {
            assert_eq!(*amount, 0.75);
            assert_eq!(unit, "ml");
            assert_eq!(portion_type, "bowl");
            assert_eq!(brand.as_ref().unwrap(), "Purina Pro Plan");
            assert_eq!(product.as_ref().unwrap(), "Normal");
        } else {
            panic!("Expected Portion block");
        }

        // Verify time data
        if let Some(BlockData::Time { date, timezone, .. }) = activity_data.get("time") {
            assert_eq!(date, "2025-10-02T11:19:00.000Z");
            assert_eq!(timezone, "Asia/Shanghai");
        } else {
            panic!("Expected Time block");
        }
    }

    #[test]
    fn test_weight_activity_deserialization() {
        let json = serde_json::json!({
            "weight": {
                "value": "5.2",
                "unit": "kg",
                "measurementType": "weight"
            },
            "time": {
                "date": "2025-10-02T11:19:00.000Z",
                "time": "",
                "timezone": "Asia/Shanghai"
            },
            "notes": "Healthy weight"
        });

        let activity_data = ActivityData::from_legacy_json(json);

        // Should trigger pet profile update
        assert!(activity_data.should_update_pet_profile());

        // Extract weight
        let weight_kg = activity_data.extract_weight_kg();
        assert!(weight_kg.is_some());
        assert!((weight_kg.unwrap() - 5.2).abs() < 0.001);
    }

    #[test]
    fn test_weight_conversion() {
        // Test gram conversion
        let json = serde_json::json!({
            "weight": {
                "value": "5200",
                "unit": "g",
                "measurementType": "weight"
            }
        });

        let activity_data = ActivityData::from_legacy_json(json);
        let weight_kg = activity_data.extract_weight_kg();
        assert!(weight_kg.is_some());
        assert!((weight_kg.unwrap() - 5.2).abs() < 0.001);

        // Test pound conversion
        let json = serde_json::json!({
            "weight": {
                "value": "11.464",
                "unit": "lb",
                "measurementType": "weight"
            }
        });

        let activity_data = ActivityData::from_legacy_json(json);
        let weight_kg = activity_data.extract_weight_kg();
        assert!(weight_kg.is_some());
        assert!((weight_kg.unwrap() - 5.2).abs() < 0.01); // Allow small rounding error
    }

    #[test]
    fn test_roundtrip_serialization() {
        let json = serde_json::json!({
            "portion": {
                "amount": 200.0,
                "unit": "g",
                "portionType": "meal",
                "brand": "Royal Canin"
            },
            "notes": "Good appetite"
        });

        let activity_data = ActivityData::from_legacy_json(json.clone());
        let serialized = activity_data.to_frontend_blocks();

        // Verify structure is preserved
        assert!(serialized.get("portion").is_some());
        assert!(serialized.get("notes").is_some());
    }

    #[test]
    fn test_number_to_string_conversion() {
        // Frontend sends number value
        let json = serde_json::json!({
            "weight": {
                "value": 1.2,
                "unit": "kg",
                "measurementType": "weight"
            }
        });

        let activity_data = ActivityData::from_legacy_json(json);

        // Verify it's stored as string internally
        if let Some(BlockData::Measurement { value, unit, .. }) = activity_data.get("weight") {
            assert_eq!(value, "1.2");
            assert_eq!(unit, "kg");
        } else {
            panic!("Expected Measurement block");
        }

        // Verify it serializes back correctly
        let serialized = activity_data.to_frontend_blocks();
        let weight_value = serialized.get("weight").unwrap().get("value").unwrap();
        assert_eq!(weight_value, "1.2");
    }

    #[test]
    fn test_string_value_accepted() {
        // Frontend can also send string value (for compatibility)
        let json = serde_json::json!({
            "weight": {
                "value": "1.234",
                "unit": "kg",
                "measurementType": "weight"
            }
        });

        let activity_data = ActivityData::from_legacy_json(json);

        // Verify it's preserved as string
        if let Some(BlockData::Measurement { value, .. }) = activity_data.get("weight") {
            assert_eq!(value, "1.234");
        } else {
            panic!("Expected Measurement block");
        }
    }
}
