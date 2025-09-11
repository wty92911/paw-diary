# Errors Module

This module provides a modular, extensible error handling system for the Paw Diary application.

## Architecture

The error system is organized into domain-specific modules:

- `common.rs` - Common error traits and types
- `pet.rs` - Pet-specific errors
- `activity.rs` - Activity-specific errors (example extension)
- `tests.rs` - Comprehensive test suite

The validation module is now separate at `src/validation/` with its own module structure.

## Usage

### Basic Usage

```rust
use crate::errors::{PetError, AppError};

// Create errors
let error = PetError::not_found(123);
println!("Error: {}", error);
println!("Severity: {:?}", error.severity());
println!("Error code: {}", error.error_code());
```

### Validation

```rust
use crate::validation::*;

// Validate pet data
validate_pet_name("Fluffy")?;
validate_weight(5.5)?;
```

### Backward Compatibility

The module maintains full backward compatibility with existing code:

```rust
use crate::errors::{PetError, validation};

// Original function names still work
validation::validate_pet_create_request(&request)?;
```

## Extending the System

### Adding New Error Domains

1. Create a new module file (e.g., `activity.rs`)
2. Define your error enum implementing `AppError` trait
3. Add the module to `mod.rs`
4. Add validation functions to `validation.rs`

Example:

```rust
// errors/activity.rs
use super::common::{AppError, ErrorSeverity};

#[derive(Error, Debug, Serialize, Deserialize, Clone)]
pub enum ActivityError {
    #[error("Activity not found with id: {id}")]
    NotFound { id: i64 },
    // ... more variants
}

impl AppError for ActivityError {
    fn severity(&self) -> ErrorSeverity { /* implementation */ }
    fn is_recoverable(&self) -> bool { /* implementation */ }
    fn error_code(&self) -> &'static str { /* implementation */ }
}
```

### Adding Validation Functions

```rust
// errors/validation.rs
pub mod activity {
    use super::super::ActivityError;
    
    pub fn validate_activity_type(activity_type: &str) -> Result<(), ActivityError> {
        // validation logic
    }
}
```

## Design Principles

1. **Modularity** - Each domain has its own error types
2. **Consistency** - All errors implement the `AppError` trait
3. **Extensibility** - Easy to add new domains without changing existing code
4. **Backward Compatibility** - Existing code continues to work unchanged
5. **Type Safety** - Compile-time error handling with rich context