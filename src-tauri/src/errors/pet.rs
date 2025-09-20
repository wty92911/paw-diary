use serde::{Deserialize, Serialize};
use thiserror::Error;

use super::common::{AppError, ErrorSeverity};

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
}

impl AppError for PetError {
    fn severity(&self) -> ErrorSeverity {
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

    fn is_recoverable(&self) -> bool {
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

    fn error_code(&self) -> &'static str {
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
