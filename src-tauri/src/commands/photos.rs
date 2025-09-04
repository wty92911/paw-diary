use super::AppState;
use crate::errors::PetError;
use crate::photo::{PhotoInfo, StorageStats};
use std::path::PathBuf;
use tauri::State;

/// Upload a pet photo from bytes data
#[tauri::command]
pub async fn upload_pet_photo(
    state: State<'_, AppState>,
    filename: String,
    photo_bytes: Vec<u8>,
    _thumbnail_size: Option<u32>,
) -> Result<String, PetError> {
    log::info!(
        "Uploading pet photo: {} ({} bytes)",
        filename,
        photo_bytes.len()
    );

    if photo_bytes.is_empty() {
        return Err(PetError::validation(
            "photo_bytes",
            "Photo data cannot be empty",
        ));
    }

    if filename.trim().is_empty() {
        return Err(PetError::validation("filename", "Filename cannot be empty"));
    }

    let photo_id = state
        .photo_service
        .store_photo_from_bytes(&photo_bytes, Some(&filename))?;

    log::info!("Pet photo uploaded successfully: {photo_id}");
    Ok(photo_id)
}

/// Upload a pet photo from file path
#[tauri::command]
pub async fn upload_pet_photo_from_path(
    state: State<'_, AppState>,
    file_path: String,
    _thumbnail_size: Option<u32>,
) -> Result<String, PetError> {
    log::info!("Uploading pet photo from path: {file_path}");

    if file_path.trim().is_empty() {
        return Err(PetError::validation(
            "file_path",
            "File path cannot be empty",
        ));
    }

    let path = PathBuf::from(file_path);
    if !path.exists() {
        return Err(PetError::validation("file_path", "File does not exist"));
    }

    let photo_id = state.photo_service.store_photo(&path)?;

    log::info!("Pet photo uploaded successfully: {photo_id}");
    Ok(photo_id)
}

/// Delete a pet photo
#[tauri::command]
pub async fn delete_pet_photo(
    state: State<'_, AppState>,
    photo_id: String,
) -> Result<(), PetError> {
    log::info!("Deleting pet photo: {photo_id}");

    if photo_id.trim().is_empty() {
        return Err(PetError::validation("photo_id", "Photo ID cannot be empty"));
    }

    // Check if photo exists before deletion
    let _info = state.photo_service.get_photo_info(&photo_id)?;

    state.photo_service.delete_photo(&photo_id)?;

    log::info!("Pet photo deleted successfully");
    Ok(())
}

/// Get information about a pet photo
#[tauri::command]
pub async fn get_pet_photo_info(
    state: State<'_, AppState>,
    photo_id: String,
) -> Result<PhotoInfo, PetError> {
    log::debug!("Getting info for pet photo: {photo_id}");

    if photo_id.trim().is_empty() {
        return Err(PetError::validation("photo_id", "Photo ID cannot be empty"));
    }

    let info = state.photo_service.get_photo_info(&photo_id)?;

    if let Some((width, height)) = info.dimensions {
        log::debug!(
            "Photo info retrieved - Size: {}x{}, File size: {} bytes",
            width,
            height,
            info.file_size
        );
    } else {
        log::debug!(
            "Photo info retrieved - No dimensions, File size: {} bytes",
            info.file_size
        );
    }
    Ok(info)
}

/// List all pet photos
#[tauri::command]
pub async fn list_pet_photos(state: State<'_, AppState>) -> Result<Vec<String>, PetError> {
    log::debug!("Listing all pet photos");

    let photos = state.photo_service.list_photos()?;

    log::debug!("Found {} pet photos", photos.len());
    Ok(photos)
}

/// Get photo storage statistics
#[tauri::command]
pub async fn get_photo_storage_stats(state: State<'_, AppState>) -> Result<StorageStats, PetError> {
    log::debug!("Getting photo storage statistics");

    let stats = state.photo_service.get_storage_stats()?;

    log::debug!(
        "Storage stats - Photos: {}, Total size: {} bytes",
        stats.photo_count,
        stats.total_size
    );
    Ok(stats)
}
