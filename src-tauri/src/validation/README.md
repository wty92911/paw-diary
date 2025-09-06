# Validation Module

This module provides validation functions for the Paw Diary application, organized by domain.

## Architecture

The validation system is organized into domain-specific modules:

- `pet.rs` - Pet-specific validation functions

## Usage

### Pet Validation

```rust
use crate::validation::*;

// Validate individual fields
validate_pet_name("Fluffy")?;
validate_weight(5.5)?;
validate_breed("Golden Retriever")?;

// Validate complete requests
validate_create_request(&create_request)?;
validate_update_request(&update_request)?;
```

### Backward Compatibility

The validation module maintains backward compatibility through the errors module:

```rust
use crate::errors::validation::*;

// Legacy function names still work
validate_pet_create_request(&request)?;
validate_pet_update_request(&request)?;
```

## Extending the System

### Adding New Validation Domains

1. Create a new module file (e.g., `activity.rs`)
2. Define validation functions that return appropriate error types
3. Add the module to `mod.rs`
4. Export functions as needed

Example:

```rust
// validation/activity.rs
use crate::errors::ActivityError;

pub fn validate_activity_type(activity_type: &str) -> Result<(), ActivityError> {
    if activity_type.trim().is_empty() {
        return Err(ActivityError::validation("type", "Activity type cannot be empty"));
    }
    
    let valid_types = ["health", "growth", "diet", "lifestyle", "expense"];
    if !valid_types.contains(&activity_type) {
        return Err(ActivityError::invalid_type(activity_type));
    }
    
    Ok(())
}
```

## Design Principles

1. **Domain Separation** - Each domain has its own validation module
2. **Error Integration** - Validation functions return domain-specific error types
3. **Reusability** - Validation functions can be used independently
4. **Backward Compatibility** - Existing validation APIs continue to work
5. **Extensibility** - Easy to add new validation domains