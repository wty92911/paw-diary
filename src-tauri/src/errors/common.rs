use serde::{Deserialize, Serialize};

/// Error severity levels for appropriate handling
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ErrorSeverity {
    Info,
    Warning,
    Error,
    Critical,
}

/// Common error trait for all error types in the application
pub trait AppError {
    /// Get error severity level for logging and handling
    fn severity(&self) -> ErrorSeverity;

    /// Check if the error is recoverable
    fn is_recoverable(&self) -> bool;

    /// Get error code for client-side handling
    fn error_code(&self) -> &'static str;
}
