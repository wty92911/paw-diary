use anyhow::Result;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// Pet data structure matching the database schema
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Pet {
    pub id: i64,
    pub name: String,
    pub birth_date: chrono::NaiveDate,
    pub species: PetSpecies,
    pub gender: PetGender,
    pub breed: Option<String>,
    pub color: Option<String>,
    pub weight_kg: Option<f32>,
    pub photo_path: Option<String>,
    pub notes: Option<String>,
    pub display_order: i64,
    pub is_archived: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Pet species enum
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum PetSpecies {
    Cat,
    Dog,
}

impl std::fmt::Display for PetSpecies {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            PetSpecies::Cat => write!(f, "cat"),
            PetSpecies::Dog => write!(f, "dog"),
        }
    }
}

impl std::str::FromStr for PetSpecies {
    type Err = anyhow::Error;

    fn from_str(s: &str) -> Result<Self> {
        match s.to_lowercase().as_str() {
            "cat" => Ok(PetSpecies::Cat),
            "dog" => Ok(PetSpecies::Dog),
            _ => Err(anyhow::anyhow!("Invalid pet species: {}", s)),
        }
    }
}

/// Pet gender enum
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum PetGender {
    Male,
    Female,
    Unknown,
}

impl std::fmt::Display for PetGender {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            PetGender::Male => write!(f, "male"),
            PetGender::Female => write!(f, "female"),
            PetGender::Unknown => write!(f, "unknown"),
        }
    }
}

impl std::str::FromStr for PetGender {
    type Err = anyhow::Error;

    fn from_str(s: &str) -> Result<Self> {
        match s.to_lowercase().as_str() {
            "male" => Ok(PetGender::Male),
            "female" => Ok(PetGender::Female),
            "unknown" => Ok(PetGender::Unknown),
            _ => Err(anyhow::anyhow!("Invalid pet gender: {}", s)),
        }
    }
}

/// Request structure for creating a new pet
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreatePetRequest {
    pub name: String,
    pub birth_date: chrono::NaiveDate,
    pub species: PetSpecies,
    pub gender: PetGender,
    pub breed: Option<String>,
    pub color: Option<String>,
    pub weight_kg: Option<f32>,
    pub photo_path: Option<String>,
    pub notes: Option<String>,
}

/// Request structure for updating a pet
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct UpdatePetRequest {
    pub name: Option<String>,
    pub birth_date: Option<chrono::NaiveDate>,
    pub species: Option<PetSpecies>,
    pub gender: Option<PetGender>,
    pub breed: Option<String>,
    pub color: Option<String>,
    pub weight_kg: Option<f32>,
    pub photo_path: Option<String>,
    pub notes: Option<String>,
}

/// Activity data structure matching the database schema
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Activity {
    pub id: i64,
    pub pet_id: i64,
    pub category: ActivityCategory,
    pub subcategory: String,
    pub title: String,
    pub description: Option<String>,
    pub activity_date: DateTime<Utc>,
    pub activity_data: Option<serde_json::Value>,
    pub cost: Option<f32>,
    pub currency: Option<String>,
    pub location: Option<String>,
    pub mood_rating: Option<i32>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Activity category enum
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ActivityCategory {
    Health,
    Growth,
    Diet,
    Lifestyle,
    Expense,
}

impl std::fmt::Display for ActivityCategory {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ActivityCategory::Health => write!(f, "health"),
            ActivityCategory::Growth => write!(f, "growth"),
            ActivityCategory::Diet => write!(f, "diet"),
            ActivityCategory::Lifestyle => write!(f, "lifestyle"),
            ActivityCategory::Expense => write!(f, "expense"),
        }
    }
}

impl std::str::FromStr for ActivityCategory {
    type Err = anyhow::Error;

    fn from_str(s: &str) -> Result<Self> {
        match s.to_lowercase().as_str() {
            "health" => Ok(ActivityCategory::Health),
            "growth" => Ok(ActivityCategory::Growth),
            "diet" => Ok(ActivityCategory::Diet),
            "lifestyle" => Ok(ActivityCategory::Lifestyle),
            "expense" => Ok(ActivityCategory::Expense),
            _ => Err(anyhow::anyhow!("Invalid activity category: {}", s)),
        }
    }
}

/// Activity attachment data structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActivityAttachment {
    pub id: i64,
    pub activity_id: i64,
    pub file_path: String,
    pub file_type: ActivityAttachmentType,
    pub file_size: Option<i64>,
    pub thumbnail_path: Option<String>,
    pub metadata: Option<serde_json::Value>,
    pub created_at: DateTime<Utc>,
}

/// Activity attachment type enum
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ActivityAttachmentType {
    Photo,
    Document,
    Video,
}

impl std::fmt::Display for ActivityAttachmentType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ActivityAttachmentType::Photo => write!(f, "photo"),
            ActivityAttachmentType::Document => write!(f, "document"),
            ActivityAttachmentType::Video => write!(f, "video"),
        }
    }
}

impl std::str::FromStr for ActivityAttachmentType {
    type Err = anyhow::Error;

    fn from_str(s: &str) -> Result<Self> {
        match s.to_lowercase().as_str() {
            "photo" => Ok(ActivityAttachmentType::Photo),
            "document" => Ok(ActivityAttachmentType::Document),
            "video" => Ok(ActivityAttachmentType::Video),
            _ => Err(anyhow::anyhow!("Invalid attachment type: {}", s)),
        }
    }
}

/// Request structure for creating a new activity
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActivityCreateRequest {
    pub pet_id: i64,
    pub category: ActivityCategory,
    pub subcategory: String,
    pub title: String,
    pub description: Option<String>,
    pub activity_date: DateTime<Utc>,
    pub activity_data: Option<serde_json::Value>,
    pub cost: Option<f32>,
    pub currency: Option<String>,
    pub location: Option<String>,
    pub mood_rating: Option<i32>,
}

/// Request structure for updating an activity
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActivityUpdateRequest {
    pub category: Option<ActivityCategory>,
    pub subcategory: Option<String>,
    pub title: Option<String>,
    pub description: Option<String>,
    pub activity_date: Option<DateTime<Utc>>,
    pub activity_data: Option<serde_json::Value>,
    pub cost: Option<f32>,
    pub currency: Option<String>,
    pub location: Option<String>,
    pub mood_rating: Option<i32>,
}

/// Filters for activity queries
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ActivityFilters {
    pub categories: Option<Vec<ActivityCategory>>,
    pub date_from: Option<DateTime<Utc>>,
    pub date_to: Option<DateTime<Utc>>,
    pub min_cost: Option<f32>,
    pub max_cost: Option<f32>,
    pub has_attachments: Option<bool>,
}

/// Result structure for activity search operations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActivitySearchResult {
    pub activities: Vec<Activity>,
    pub total_count: i64,
    pub has_more: bool,
}
