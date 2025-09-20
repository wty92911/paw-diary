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
    pub activity_data: Option<serde_json::Value>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Activity category enum
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Hash)]
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
    pub activity_data: Option<serde_json::Value>,
}

/// Request structure for updating an activity
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ActivityUpdateRequest {
    pub category: Option<ActivityCategory>,
    pub subcategory: Option<String>,
    pub activity_data: Option<serde_json::Value>,
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

// Data Migration and Validation Result Types

/// Result structure for activity data import operations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportResult {
    pub total_imported: i64,
    pub total_failed: i64,
    pub errors: Vec<String>,
    pub rollback_data: Vec<i64>, // Activity IDs that can be rolled back
}

/// Report structure for activity data validation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationReport {
    pub total_activities: i64,
    pub valid_activities: i64,
    pub issues: Vec<String>,
    pub orphaned_attachments: i64,
    pub missing_pets: Vec<i64>,
}

/// Report structure for activity data cleanup operations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CleanupReport {
    pub orphaned_attachments_removed: i64,
    pub invalid_activities_fixed: i64,
    pub fts_entries_rebuilt: i64,
}

// Request/Response Types for Activity Operations

/// Request structure for getting activities with filtering and pagination
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct GetActivitiesRequest {
    pub pet_id: Option<i64>,
    pub category: Option<ActivityCategory>,
    pub start_date: Option<DateTime<Utc>>,
    pub end_date: Option<DateTime<Utc>>,
    pub sort_by: Option<String>, // "created_at", "updated_at"
    pub sort_desc: Option<bool>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

/// Response structure for getting activities
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetActivitiesResponse {
    pub activities: Vec<Activity>,
    pub total_count: i64,
    pub has_more: bool,
}

/// Request structure for searching activities
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchActivitiesRequest {
    pub pet_id: Option<i64>,
    pub query: String,
    pub limit: Option<i64>,
}

/// Request structure for exporting activities
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ExportActivitiesRequest {
    pub pet_id: Option<i64>,
    pub format: Option<String>, // "json", "csv", "backup"
}

/// Response structure for activity statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActivityStatsResponse {
    pub total_activities: i64,
    pub category_counts: std::collections::HashMap<String, i64>,
    pub recent_activities: Vec<Activity>,
    pub date_range_days: i64,
}
