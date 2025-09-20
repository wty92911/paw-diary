use crate::database::{CreatePetRequest, UpdatePetRequest};
use crate::errors::PetError;

/// Validate pet create request
pub fn validate_create_request(request: &CreatePetRequest) -> Result<(), PetError> {
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
pub fn validate_update_request(request: &UpdatePetRequest) -> Result<(), PetError> {
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

// Legacy function name aliases for backward compatibility
pub use validate_create_request as validate_pet_create_request;
pub use validate_update_request as validate_pet_update_request;
