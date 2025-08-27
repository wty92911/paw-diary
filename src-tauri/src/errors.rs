use serde::{Deserialize, Serialize};
use thiserror::Error;

/// Comprehensive error types for pet management operations
#[derive(Error, Debug, Serialize, Deserialize, Clone)]
pub enum PetError {
    #[error("Pet not found with id: {id}")]
    NotFound { id: i64 },

    #[error("Database error: {message}")]
    Database { message: String },

    #[error("Validation error: {field} - {message}")]
    Validation { field: String, message: String },

    #[error("Photo processing error: {message}")]
    PhotoProcessing { message: String },

    #[error("File system error: {message}")]
    FileSystem { message: String },

    #[error("Invalid input: {message}")]
    InvalidInput { message: String },

    #[error("Operation failed: {message}")]
    OperationFailed { message: String },

    #[error("Concurrent access error: {message}")]
    ConcurrentAccess { message: String },

    #[error("Resource limit exceeded: {message}")]
    ResourceLimit { message: String },

    #[error("Permission denied: {message}")]
    PermissionDenied { message: String },
}

impl PetError {
    /// Create a new NotFound error
    pub fn not_found(id: i64) -> Self {
        PetError::NotFound { id }
    }

    /// Create a new Database error
    pub fn database<S: Into<String>>(message: S) -> Self {
        PetError::Database {
            message: message.into(),
        }
    }

    /// Create a new Validation error
    pub fn validation<S: Into<String>>(field: S, message: S) -> Self {
        PetError::Validation {
            field: field.into(),
            message: message.into(),
        }
    }

    /// Create a new PhotoProcessing error
    pub fn photo_processing<S: Into<String>>(message: S) -> Self {
        PetError::PhotoProcessing {
            message: message.into(),
        }
    }

    /// Create a new FileSystem error
    pub fn file_system<S: Into<String>>(message: S) -> Self {
        PetError::FileSystem {
            message: message.into(),
        }
    }

    /// Create a new InvalidInput error
    pub fn invalid_input<S: Into<String>>(message: S) -> Self {
        PetError::InvalidInput {
            message: message.into(),
        }
    }

    /// Create a new OperationFailed error
    pub fn operation_failed<S: Into<String>>(message: S) -> Self {
        PetError::OperationFailed {
            message: message.into(),
        }
    }

    /// Create a new ConcurrentAccess error
    pub fn concurrent_access<S: Into<String>>(message: S) -> Self {
        PetError::ConcurrentAccess {
            message: message.into(),
        }
    }

    /// Create a new ResourceLimit error
    pub fn resource_limit<S: Into<String>>(message: S) -> Self {
        PetError::ResourceLimit {
            message: message.into(),
        }
    }

    /// Create a new PermissionDenied error
    pub fn permission_denied<S: Into<String>>(message: S) -> Self {
        PetError::PermissionDenied {
            message: message.into(),
        }
    }

    /// Get error severity level for logging and handling
    pub fn severity(&self) -> ErrorSeverity {
        match self {
            PetError::NotFound { .. } => ErrorSeverity::Info,
            PetError::Database { .. } => ErrorSeverity::Error,
            PetError::Validation { .. } => ErrorSeverity::Warning,
            PetError::PhotoProcessing { .. } => ErrorSeverity::Warning,
            PetError::FileSystem { .. } => ErrorSeverity::Error,
            PetError::InvalidInput { .. } => ErrorSeverity::Warning,
            PetError::OperationFailed { .. } => ErrorSeverity::Error,
            PetError::ConcurrentAccess { .. } => ErrorSeverity::Warning,
            PetError::ResourceLimit { .. } => ErrorSeverity::Error,
            PetError::PermissionDenied { .. } => ErrorSeverity::Error,
        }
    }

    /// Check if the error is recoverable
    pub fn is_recoverable(&self) -> bool {
        match self {
            PetError::NotFound { .. } => false,
            PetError::Database { .. } => true,
            PetError::Validation { .. } => true,
            PetError::PhotoProcessing { .. } => true,
            PetError::FileSystem { .. } => true,
            PetError::InvalidInput { .. } => true,
            PetError::OperationFailed { .. } => true,
            PetError::ConcurrentAccess { .. } => true,
            PetError::ResourceLimit { .. } => false,
            PetError::PermissionDenied { .. } => false,
        }
    }

    /// Get error code for client-side handling
    pub fn error_code(&self) -> &'static str {
        match self {
            PetError::NotFound { .. } => "PET_NOT_FOUND",
            PetError::Database { .. } => "DATABASE_ERROR",
            PetError::Validation { .. } => "VALIDATION_ERROR",
            PetError::PhotoProcessing { .. } => "PHOTO_PROCESSING_ERROR",
            PetError::FileSystem { .. } => "FILE_SYSTEM_ERROR",
            PetError::InvalidInput { .. } => "INVALID_INPUT",
            PetError::OperationFailed { .. } => "OPERATION_FAILED",
            PetError::ConcurrentAccess { .. } => "CONCURRENT_ACCESS",
            PetError::ResourceLimit { .. } => "RESOURCE_LIMIT",
            PetError::PermissionDenied { .. } => "PERMISSION_DENIED",
        }
    }
}

/// Error severity levels for appropriate handling
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ErrorSeverity {
    Info,
    Warning,
    Error,
    Critical,
}

impl From<anyhow::Error> for PetError {
    fn from(error: anyhow::Error) -> Self {
        PetError::operation_failed(error.to_string())
    }
}

impl From<std::io::Error> for PetError {
    fn from(error: std::io::Error) -> Self {
        match error.kind() {
            std::io::ErrorKind::NotFound => PetError::file_system("File not found"),
            std::io::ErrorKind::PermissionDenied => {
                PetError::permission_denied("File access denied")
            }
            std::io::ErrorKind::AlreadyExists => PetError::file_system("File already exists"),
            _ => PetError::file_system(error.to_string()),
        }
    }
}

impl From<image::ImageError> for PetError {
    fn from(error: image::ImageError) -> Self {
        PetError::photo_processing(error.to_string())
    }
}

/// Validation helper functions
pub mod validation {
    use super::PetError;
    use crate::database::{PetCreateRequest, PetUpdateRequest};

    /// Validate pet create request
    pub fn validate_pet_create_request(request: &PetCreateRequest) -> Result<(), PetError> {
        validate_pet_name(&request.name)?;

        if let Some(ref breed) = request.breed {
            validate_breed(breed)?;
        }

        if let Some(ref color) = request.color {
            validate_color(color)?;
        }

        if let Some(weight) = request.weight_kg {
            validate_weight(weight)?;
        }

        if let Some(ref notes) = request.notes {
            validate_notes(notes)?;
        }

        Ok(())
    }

    /// Validate pet update request
    pub fn validate_pet_update_request(request: &PetUpdateRequest) -> Result<(), PetError> {
        if let Some(ref name) = request.name {
            validate_pet_name(name)?;
        }

        if let Some(ref breed) = request.breed {
            validate_breed(breed)?;
        }

        if let Some(ref color) = request.color {
            validate_color(color)?;
        }

        if let Some(weight) = request.weight_kg {
            validate_weight(weight)?;
        }

        if let Some(ref notes) = request.notes {
            validate_notes(notes)?;
        }

        Ok(())
    }

    /// Validate pet name
    pub fn validate_pet_name(name: &str) -> Result<(), PetError> {
        let trimmed = name.trim();

        if trimmed.is_empty() {
            return Err(PetError::validation("name", "Pet name cannot be empty"));
        }

        if trimmed.len() > 100 {
            return Err(PetError::validation(
                "name",
                "Pet name cannot exceed 100 characters",
            ));
        }

        // Check for invalid characters (basic validation)
        if trimmed.chars().any(|c| c.is_control()) {
            return Err(PetError::validation(
                "name",
                "Pet name contains invalid characters",
            ));
        }

        Ok(())
    }

    /// Validate breed
    pub fn validate_breed(breed: &str) -> Result<(), PetError> {
        let trimmed = breed.trim();

        if trimmed.len() > 100 {
            return Err(PetError::validation(
                "breed",
                "Breed cannot exceed 100 characters",
            ));
        }

        Ok(())
    }

    /// Validate color
    pub fn validate_color(color: &str) -> Result<(), PetError> {
        let trimmed = color.trim();

        if trimmed.len() > 50 {
            return Err(PetError::validation(
                "color",
                "Color cannot exceed 50 characters",
            ));
        }

        Ok(())
    }

    /// Validate weight
    pub fn validate_weight(weight: f32) -> Result<(), PetError> {
        if weight < 0.0 {
            return Err(PetError::validation(
                "weight_kg",
                "Weight cannot be negative",
            ));
        }

        if weight > 200.0 {
            return Err(PetError::validation(
                "weight_kg",
                "Weight seems unrealistic (over 200kg)",
            ));
        }

        // Check for reasonable precision (2 decimal places)
        let rounded = (weight * 100.0).round() / 100.0;
        if (weight - rounded).abs() > f32::EPSILON {
            return Err(PetError::validation(
                "weight_kg",
                "Weight precision should not exceed 2 decimal places",
            ));
        }

        Ok(())
    }

    /// Validate notes
    pub fn validate_notes(notes: &str) -> Result<(), PetError> {
        if notes.len() > 2000 {
            return Err(PetError::validation(
                "notes",
                "Notes cannot exceed 2000 characters",
            ));
        }

        Ok(())
    }

    /// Validate photo path
    pub fn validate_photo_path(path: &str) -> Result<(), PetError> {
        if path.trim().is_empty() {
            return Err(PetError::validation(
                "photo_path",
                "Photo path cannot be empty",
            ));
        }

        if path.len() > 255 {
            return Err(PetError::validation(
                "photo_path",
                "Photo path cannot exceed 255 characters",
            ));
        }

        // Basic path traversal protection
        if path.contains("..") || path.contains("//") {
            return Err(PetError::validation(
                "photo_path",
                "Photo path contains invalid sequences",
            ));
        }

        Ok(())
    }

    /// Validate display order list for reordering
    pub fn validate_reorder_list(pet_ids: &[i64]) -> Result<(), PetError> {
        if pet_ids.is_empty() {
            return Err(PetError::validation(
                "pet_ids",
                "Pet ID list cannot be empty",
            ));
        }

        if pet_ids.len() > 100 {
            return Err(PetError::validation(
                "pet_ids",
                "Too many pets to reorder (limit: 100)",
            ));
        }

        // Check for duplicates
        let mut sorted_ids = pet_ids.to_vec();
        sorted_ids.sort_unstable();
        for window in sorted_ids.windows(2) {
            if window[0] == window[1] {
                return Err(PetError::validation(
                    "pet_ids",
                    "Duplicate pet IDs found in reorder list",
                ));
            }
        }

        // Check for invalid IDs
        for &id in pet_ids {
            if id <= 0 {
                return Err(PetError::validation(
                    "pet_ids",
                    "Invalid pet ID (must be positive)",
                ));
            }
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::database::{PetCreateRequest, PetGender, PetSpecies};
    use chrono::NaiveDate;

    #[test]
    fn test_pet_error_creation() {
        let error = PetError::not_found(123);
        assert_eq!(error.error_code(), "PET_NOT_FOUND");
        assert_eq!(error.severity(), ErrorSeverity::Info);
        assert!(!error.is_recoverable());
    }

    #[test]
    fn test_validation_pet_name() {
        use validation::validate_pet_name;

        // Valid names
        assert!(validate_pet_name("Fluffy").is_ok());
        assert!(validate_pet_name("Mr. Whiskers").is_ok());
        assert!(validate_pet_name("123").is_ok());

        // Invalid names
        assert!(validate_pet_name("").is_err());
        assert!(validate_pet_name("   ").is_err());
        assert!(validate_pet_name(&"a".repeat(101)).is_err());
    }

    #[test]
    fn test_validation_weight() {
        use validation::validate_weight;

        // Valid weights
        assert!(validate_weight(5.0).is_ok());
        assert!(validate_weight(0.1).is_ok());
        assert!(validate_weight(50.25).is_ok());

        // Invalid weights
        assert!(validate_weight(-1.0).is_err());
        assert!(validate_weight(250.0).is_err());
    }

    #[test]
    fn test_validation_create_request() {
        use validation::validate_pet_create_request;

        let valid_request = PetCreateRequest {
            name: "Test Pet".to_string(),
            birth_date: NaiveDate::from_ymd_opt(2020, 1, 1).unwrap(),
            species: PetSpecies::Cat,
            gender: PetGender::Male,
            breed: Some("Persian".to_string()),
            color: Some("White".to_string()),
            weight_kg: Some(5.0),
            photo_path: None,
            notes: Some("A lovely pet".to_string()),
            display_order: None,
        };

        assert!(validate_pet_create_request(&valid_request).is_ok());

        let invalid_request = PetCreateRequest {
            name: "".to_string(), // Invalid empty name
            birth_date: NaiveDate::from_ymd_opt(2020, 1, 1).unwrap(),
            species: PetSpecies::Cat,
            gender: PetGender::Male,
            breed: None,
            color: None,
            weight_kg: None,
            photo_path: None,
            notes: None,
            display_order: None,
        };

        assert!(validate_pet_create_request(&invalid_request).is_err());
    }

    #[test]
    fn test_validation_reorder_list() {
        use validation::validate_reorder_list;

        // Valid lists
        assert!(validate_reorder_list(&[1, 2, 3]).is_ok());
        assert!(validate_reorder_list(&[5]).is_ok());

        // Invalid lists
        assert!(validate_reorder_list(&[]).is_err()); // Empty
        assert!(validate_reorder_list(&[1, 2, 2]).is_err()); // Duplicates
        assert!(validate_reorder_list(&[0, 1, 2]).is_err()); // Invalid ID
        assert!(validate_reorder_list(&[-1, 1, 2]).is_err()); // Negative ID
    }

    #[test]
    fn test_error_severity() {
        assert_eq!(PetError::not_found(1).severity(), ErrorSeverity::Info);
        assert_eq!(PetError::database("test").severity(), ErrorSeverity::Error);
        assert_eq!(
            PetError::validation("field", "message").severity(),
            ErrorSeverity::Warning
        );
        assert_eq!(
            PetError::permission_denied("test").severity(),
            ErrorSeverity::Error
        );
    }
}
