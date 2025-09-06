use super::AppState;
use crate::database::{CreatePetRequest, Pet, UpdatePetRequest};
use crate::errors::PetError;
use crate::validation;
use tauri::State;

/// Create a new pet
#[tauri::command]
pub async fn create_pet(
    state: State<'_, AppState>,
    pet_data: CreatePetRequest,
) -> Result<Pet, PetError> {
    log::info!("Creating new pet: {}", pet_data.name);

    // Validate input data
    validation::validate_pet_create_request(&pet_data)?;

    let pet = state.database.create_pet(pet_data).await?;

    log::info!("Pet created successfully with ID: {}", pet.id);
    Ok(pet)
}

/// Get all pets, optionally including archived ones
#[tauri::command]
pub async fn get_pets(
    state: State<'_, AppState>,
    include_archived: bool,
) -> Result<Vec<Pet>, PetError> {
    log::info!("Getting pets (include_archived: {include_archived})");

    let pets = state.database.get_pets(include_archived).await?;

    log::info!("Retrieved {} pets", pets.len());
    Ok(pets)
}

/// Get a pet by ID
#[tauri::command]
pub async fn get_pet_by_id(state: State<'_, AppState>, id: i64) -> Result<Pet, PetError> {
    log::info!("Getting pet with ID: {id}");

    if id <= 0 {
        return Err(PetError::validation("id", "Pet ID must be positive"));
    }

    let pet = state.database.get_pet_by_id(id).await?;

    log::info!("Pet retrieved: {}", pet.name);
    Ok(pet)
}

/// Update a pet
#[tauri::command]
pub async fn update_pet(
    state: State<'_, AppState>,
    id: i64,
    pet_data: UpdatePetRequest,
) -> Result<Pet, PetError> {
    log::info!("Updating pet with ID: {id}");

    if id <= 0 {
        return Err(PetError::validation("id", "Pet ID must be positive"));
    }

    // Validate input data
    validation::validate_pet_update_request(&pet_data)?;

    let pet = state.database.update_pet(id, pet_data).await?;

    log::info!("Pet updated successfully: {}", pet.name);
    Ok(pet)
}

/// Delete a pet (soft delete by archiving)
#[tauri::command]
pub async fn delete_pet(state: State<'_, AppState>, id: i64) -> Result<(), PetError> {
    log::info!("Deleting pet with ID: {id}");

    if id <= 0 {
        return Err(PetError::validation("id", "Pet ID must be positive"));
    }

    // Verify pet exists
    let pet = state.database.get_pet_by_id(id).await?;
    log::info!("Archiving pet: {}", pet.name);

    state.database.delete_pet(id).await?;

    log::info!("Pet archived successfully");
    Ok(())
}

/// Reorder pets by updating their display_order
#[tauri::command]
pub async fn reorder_pets(state: State<'_, AppState>, pet_ids: Vec<i64>) -> Result<(), PetError> {
    log::info!("Reordering {} pets", pet_ids.len());

    // Validate input
    if pet_ids.is_empty() {
        return Err(PetError::validation(
            "pet_ids",
            "Pet IDs list cannot be empty",
        ));
    }

    // Validate each ID
    for &id in &pet_ids {
        if id <= 0 {
            return Err(PetError::validation(
                "pet_ids",
                "All Pet IDs must be positive",
            ));
        }
    }

    state.database.reorder_pets(pet_ids).await?;

    log::info!("Pets reordered successfully");
    Ok(())
}
