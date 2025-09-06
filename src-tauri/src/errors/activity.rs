use serde::{Deserialize, Serialize};
use thiserror::Error;

use super::common::{AppError, ErrorSeverity};

/// Error types for activity management operations
#[derive(Error, Debug, Serialize, Deserialize, Clone)]
pub enum ActivityError {
    #[error("Activity not found with id: {id}")]
    NotFound { id: i64 },

    #[error("Invalid activity type: {activity_type}")]
    InvalidType { activity_type: String },

    #[error("Invalid activity data: {message}")]
    InvalidData { message: String },

    #[error("Activity validation error: {field} - {message}")]
    Validation { field: String, message: String },

    #[error("Pet not associated with activity: pet_id={pet_id}, activity_id={activity_id}")]
    PetMismatch { pet_id: i64, activity_id: i64 },

    #[error("Activity date out of range: {message}")]
    DateOutOfRange { message: String },
}

impl ActivityError {
    /// Create a new NotFound error
    pub fn not_found(id: i64) -> Self {
        ActivityError::NotFound { id }
    }

    /// Create a new InvalidType error
    pub fn invalid_type<S: Into<String>>(activity_type: S) -> Self {
        ActivityError::InvalidType {
            activity_type: activity_type.into(),
        }
    }

    /// Create a new InvalidData error
    pub fn invalid_data<S: Into<String>>(message: S) -> Self {
        ActivityError::InvalidData {
            message: message.into(),
        }
    }

    /// Create a new Validation error
    pub fn validation<S: Into<String>>(field: S, message: S) -> Self {
        ActivityError::Validation {
            field: field.into(),
            message: message.into(),
        }
    }

    /// Create a new PetMismatch error
    pub fn pet_mismatch(pet_id: i64, activity_id: i64) -> Self {
        ActivityError::PetMismatch {
            pet_id,
            activity_id,
        }
    }

    /// Create a new DateOutOfRange error
    pub fn date_out_of_range<S: Into<String>>(message: S) -> Self {
        ActivityError::DateOutOfRange {
            message: message.into(),
        }
    }
}

impl AppError for ActivityError {
    fn severity(&self) -> ErrorSeverity {
        match self {
            ActivityError::NotFound { .. } => ErrorSeverity::Info,
            ActivityError::InvalidType { .. } => ErrorSeverity::Warning,
            ActivityError::InvalidData { .. } => ErrorSeverity::Warning,
            ActivityError::Validation { .. } => ErrorSeverity::Warning,
            ActivityError::PetMismatch { .. } => ErrorSeverity::Error,
            ActivityError::DateOutOfRange { .. } => ErrorSeverity::Warning,
        }
    }

    fn is_recoverable(&self) -> bool {
        match self {
            ActivityError::NotFound { .. } => false,
            ActivityError::InvalidType { .. } => true,
            ActivityError::InvalidData { .. } => true,
            ActivityError::Validation { .. } => true,
            ActivityError::PetMismatch { .. } => false,
            ActivityError::DateOutOfRange { .. } => true,
        }
    }

    fn error_code(&self) -> &'static str {
        match self {
            ActivityError::NotFound { .. } => "ACTIVITY_NOT_FOUND",
            ActivityError::InvalidType { .. } => "INVALID_ACTIVITY_TYPE",
            ActivityError::InvalidData { .. } => "INVALID_ACTIVITY_DATA",
            ActivityError::Validation { .. } => "ACTIVITY_VALIDATION_ERROR",
            ActivityError::PetMismatch { .. } => "PET_ACTIVITY_MISMATCH",
            ActivityError::DateOutOfRange { .. } => "ACTIVITY_DATE_OUT_OF_RANGE",
        }
    }
}
