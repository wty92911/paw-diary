use super::AppState;
use crate::database::{
    Activity, ActivityAttachment, ActivityAttachmentType, ActivityCreateRequest, ActivityFilters,
    ActivitySearchResult, ActivityUpdateRequest,
};
use crate::errors::PetError;
use tauri::State;

/// Create a new activity
#[tauri::command]
pub async fn create_activity(
    state: State<'_, AppState>,
    activity_data: ActivityCreateRequest,
) -> Result<Activity, PetError> {
    log::info!("Creating new activity: {}", activity_data.title);

    // Validate input data
    if activity_data.pet_id <= 0 {
        return Err(PetError::validation("pet_id", "Pet ID must be positive"));
    }

    if activity_data.title.trim().is_empty() {
        return Err(PetError::validation(
            "title",
            "Activity title cannot be empty",
        ));
    }

    // Verify pet exists
    let _pet = state.database.get_pet_by_id(activity_data.pet_id).await?;

    // Create the activity
    let activity = state.database.create_activity(activity_data).await?;

    log::info!("Activity created successfully with ID: {}", activity.id);
    Ok(activity)
}

/// Get activities with optional filtering
#[tauri::command]
pub async fn get_activities(
    state: State<'_, AppState>,
    pet_id: Option<i64>,
    filters: Option<ActivityFilters>,
    limit: Option<i64>,
    offset: Option<i64>,
) -> Result<ActivitySearchResult, PetError> {
    log::info!("Getting activities - pet_id: {pet_id:?}, limit: {limit:?}, offset: {offset:?}");

    // Validate pagination parameters
    if let Some(limit_val) = limit {
        if limit_val <= 0 {
            return Err(PetError::validation("limit", "Limit must be positive"));
        }
        if limit_val > 1000 {
            return Err(PetError::validation("limit", "Limit cannot exceed 1000"));
        }
    }

    if let Some(offset_val) = offset {
        if offset_val < 0 {
            return Err(PetError::validation("offset", "Offset cannot be negative"));
        }
    }

    let result = state
        .database
        .get_activities(pet_id, filters, limit, offset)
        .await?;

    log::info!("Retrieved {} activities", result.activities.len());
    Ok(result)
}

/// Get activity by ID
#[tauri::command]
pub async fn get_activity_by_id(state: State<'_, AppState>, id: i64) -> Result<Activity, PetError> {
    log::info!("Getting activity with ID: {id}");

    if id <= 0 {
        return Err(PetError::validation("id", "Activity ID must be positive"));
    }

    let activity = state.database.get_activity_by_id(id).await?;

    log::info!("Activity retrieved: {}", activity.title);
    Ok(activity)
}

/// Update an activity
#[tauri::command]
pub async fn update_activity(
    state: State<'_, AppState>,
    id: i64,
    activity_data: ActivityUpdateRequest,
) -> Result<Activity, PetError> {
    log::info!("Updating activity with ID: {id}");

    if id <= 0 {
        return Err(PetError::validation("id", "Activity ID must be positive"));
    }

    // Validate title if provided
    if let Some(ref title) = activity_data.title {
        if title.trim().is_empty() {
            return Err(PetError::validation(
                "title",
                "Activity title cannot be empty",
            ));
        }
    }

    // Verify activity exists
    let _existing_activity = state.database.get_activity_by_id(id).await?;

    let activity = state.database.update_activity(id, activity_data).await?;

    log::info!("Activity updated successfully: {}", activity.title);
    Ok(activity)
}

/// Delete an activity
#[tauri::command]
pub async fn delete_activity(state: State<'_, AppState>, id: i64) -> Result<(), PetError> {
    log::info!("Deleting activity with ID: {id}");

    if id <= 0 {
        return Err(PetError::validation("id", "Activity ID must be positive"));
    }

    // Verify activity exists
    let _activity = state.database.get_activity_by_id(id).await?;

    state.database.delete_activity(id).await?;

    log::info!("Activity deleted successfully");
    Ok(())
}

/// Search activities using full-text search
#[tauri::command]
pub async fn search_activities(
    state: State<'_, AppState>,
    search_query: String,
    pet_id: Option<i64>,
    limit: Option<i64>,
    offset: Option<i64>,
) -> Result<ActivitySearchResult, PetError> {
    log::info!("Searching activities - query: '{search_query}', pet_id: {pet_id:?}");

    if search_query.trim().is_empty() {
        return Err(PetError::validation(
            "search_query",
            "Search query cannot be empty",
        ));
    }

    // Validate pagination parameters
    if let Some(limit_val) = limit {
        if limit_val <= 0 {
            return Err(PetError::validation("limit", "Limit must be positive"));
        }
        if limit_val > 1000 {
            return Err(PetError::validation("limit", "Limit cannot exceed 1000"));
        }
    }

    if let Some(offset_val) = offset {
        if offset_val < 0 {
            return Err(PetError::validation("offset", "Offset cannot be negative"));
        }
    }

    let result = state
        .database
        .search_activities(&search_query, pet_id, limit, offset)
        .await?;

    log::info!(
        "Found {} activities matching search",
        result.activities.len()
    );
    Ok(result)
}

// ==================== ACTIVITY ATTACHMENT COMMANDS ====================

/// Upload an attachment for an activity (photo or document)
#[tauri::command]
pub async fn upload_activity_attachment(
    state: State<'_, AppState>,
    activity_id: i64,
    filename: String,
    file_bytes: Vec<u8>,
    file_type: ActivityAttachmentType,
    metadata: Option<serde_json::Value>,
) -> Result<ActivityAttachment, PetError> {
    log::info!(
        "Uploading attachment for activity {}: {} ({} bytes, type: {:?})",
        activity_id,
        filename,
        file_bytes.len(),
        file_type
    );

    // Validate input data
    if activity_id <= 0 {
        return Err(PetError::validation(
            "activity_id",
            "Activity ID must be positive",
        ));
    }

    if filename.trim().is_empty() {
        return Err(PetError::validation("filename", "Filename cannot be empty"));
    }

    if file_bytes.is_empty() {
        return Err(PetError::validation(
            "file_bytes",
            "File data cannot be empty",
        ));
    }

    // Verify activity exists
    let _activity = state.database.get_activity_by_id(activity_id).await?;

    // Store the file using PhotoService
    let file_id = state
        .photo_service
        .store_photo_from_bytes(&file_bytes, Some(&filename))?;

    // Create the attachment record in database
    let attachment = state
        .database
        .create_activity_attachment(
            activity_id,
            file_id.clone(),
            file_type,
            Some(file_bytes.len() as i64),
            None, // thumbnail_path - could be generated for photos
            metadata,
        )
        .await?;

    log::info!(
        "Activity attachment uploaded successfully with ID: {}",
        attachment.id
    );
    Ok(attachment)
}

/// Upload an attachment from file path
#[tauri::command]
pub async fn upload_activity_attachment_from_path(
    state: State<'_, AppState>,
    activity_id: i64,
    file_path: String,
    file_type: ActivityAttachmentType,
    metadata: Option<serde_json::Value>,
) -> Result<ActivityAttachment, PetError> {
    log::info!(
        "Uploading attachment from path for activity {activity_id}: {file_path} (type: {file_type:?})"
    );

    // Validate input data
    if activity_id <= 0 {
        return Err(PetError::validation(
            "activity_id",
            "Activity ID must be positive",
        ));
    }

    if file_path.trim().is_empty() {
        return Err(PetError::validation(
            "file_path",
            "File path cannot be empty",
        ));
    }

    let path = std::path::PathBuf::from(&file_path);
    if !path.exists() {
        return Err(PetError::validation("file_path", "File does not exist"));
    }

    // Verify activity exists
    let _activity = state.database.get_activity_by_id(activity_id).await?;

    // Store the file using PhotoService
    let file_id = state.photo_service.store_photo(&path)?;

    // Get file metadata
    let file_size = std::fs::metadata(&path).map(|m| m.len() as i64).ok();

    // Create the attachment record in database
    let attachment = state
        .database
        .create_activity_attachment(
            activity_id,
            file_id.clone(),
            file_type,
            file_size,
            None, // thumbnail_path
            metadata,
        )
        .await?;

    log::info!(
        "Activity attachment uploaded successfully with ID: {}",
        attachment.id
    );
    Ok(attachment)
}

/// Get attachments for an activity
#[tauri::command]
pub async fn get_activity_attachments(
    state: State<'_, AppState>,
    activity_id: i64,
) -> Result<Vec<ActivityAttachment>, PetError> {
    log::info!("Getting attachments for activity: {activity_id}");

    if activity_id <= 0 {
        return Err(PetError::validation(
            "activity_id",
            "Activity ID must be positive",
        ));
    }

    // Verify activity exists
    let _activity = state.database.get_activity_by_id(activity_id).await?;

    let attachments = state.database.get_activity_attachments(activity_id).await?;

    log::info!(
        "Retrieved {} attachments for activity {}",
        attachments.len(),
        activity_id
    );
    Ok(attachments)
}

/// Get attachment by ID
#[tauri::command]
pub async fn get_activity_attachment_by_id(
    state: State<'_, AppState>,
    attachment_id: i64,
) -> Result<ActivityAttachment, PetError> {
    log::info!("Getting attachment with ID: {attachment_id}");

    if attachment_id <= 0 {
        return Err(PetError::validation(
            "attachment_id",
            "Attachment ID must be positive",
        ));
    }

    let attachment = state
        .database
        .get_activity_attachment_by_id(attachment_id)
        .await?;

    log::info!("Retrieved attachment: {}", attachment.file_path);
    Ok(attachment)
}

/// Delete an activity attachment
#[tauri::command]
pub async fn delete_activity_attachment(
    state: State<'_, AppState>,
    attachment_id: i64,
) -> Result<(), PetError> {
    log::info!("Deleting activity attachment with ID: {attachment_id}");

    if attachment_id <= 0 {
        return Err(PetError::validation(
            "attachment_id",
            "Attachment ID must be positive",
        ));
    }

    // Get attachment info before deletion
    let attachment = state
        .database
        .get_activity_attachment_by_id(attachment_id)
        .await?;

    // Delete the file using PhotoService
    match state.photo_service.delete_photo(&attachment.file_path) {
        Ok(_) => log::info!("File deleted successfully: {}", attachment.file_path),
        Err(e) => log::warn!("Failed to delete file {}: {}", attachment.file_path, e),
    }

    // Delete the attachment record from database
    state
        .database
        .delete_activity_attachment(attachment_id)
        .await?;

    log::info!("Activity attachment deleted successfully");
    Ok(())
}
