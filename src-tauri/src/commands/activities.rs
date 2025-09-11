use super::AppState;
use crate::database::{Activity, ActivityCreateRequest, ActivityUpdateRequest};
use crate::errors::ActivityError;
use tauri::State;

/// Create a new activity
#[tauri::command]
pub async fn create_activity(
    state: State<'_, AppState>,
    activity_data: ActivityCreateRequest,
) -> Result<Activity, ActivityError> {
    log::info!("[CREATE_ACTIVITY] Starting activity creation");
    log::debug!("[CREATE_ACTIVITY] Request params: {{\"pet_id\": {}, \"category\": \"{}\", \"subcategory\": \"{}\", \"activity_data\": {}}}",
        activity_data.pet_id,
        activity_data.category,
        activity_data.subcategory,
        activity_data.activity_data.as_ref().map(|v| v.to_string()).unwrap_or("null".to_string())
    );

    // Verify pet exists
    if let Err(e) = state.database.get_pet_by_id(activity_data.pet_id).await {
        log::error!(
            "[CREATE_ACTIVITY] Pet validation failed: pet_id={}, error={}",
            activity_data.pet_id,
            e
        );
        return Err(ActivityError::validation(
            "pet_id",
            &format!("Pet not found: {e}"),
        ));
    }

    match state.database.create_activity(activity_data).await {
        Ok(activity) => {
            log::info!(
                "[CREATE_ACTIVITY] Success: created activity_id={} for pet_id={}",
                activity.id,
                activity.pet_id
            );
            log::debug!("[CREATE_ACTIVITY] Response: {{\"id\": {}, \"pet_id\": {}, \"category\": \"{}\", \"subcategory\": \"{}\", \"created_at\": \"{}\"}}", 
                activity.id, activity.pet_id, activity.category, activity.subcategory, activity.created_at
            );
            Ok(activity)
        }
        Err(e) => {
            log::error!("[CREATE_ACTIVITY] Database error: {e}");
            Err(e)
        }
    }
}

/// Update an existing activity - backward compatible version (less secure)
#[tauri::command]
pub async fn update_activity(
    state: State<'_, AppState>,
    activity_id: i64,
    updates: ActivityUpdateRequest,
) -> Result<Activity, ActivityError> {
    log::info!("[UPDATE_ACTIVITY] Starting activity update (legacy API)");
    log::debug!("[UPDATE_ACTIVITY] Request params: {{\"activity_id\": {}, \"updates\": {{\"category\": {:?}, \"subcategory\": {:?}, \"activity_data\": {}}}}}",
        activity_id,
        updates.category,
        updates.subcategory,
        updates.activity_data.as_ref().map(|v| v.to_string()).unwrap_or("null".to_string())
    );

    if activity_id <= 0 {
        log::error!("[UPDATE_ACTIVITY] Invalid activity_id: {activity_id}");
        return Err(ActivityError::validation(
            "activity_id",
            "Activity ID must be positive",
        ));
    }

    // Check if activity exists
    let _existing_activity = match state.database.get_activity_by_id(activity_id).await {
        Ok(activity) => {
            log::debug!(
                "[UPDATE_ACTIVITY] Found existing activity: id={}, pet_id={}, category={}",
                activity.id,
                activity.pet_id,
                activity.category
            );
            activity
        }
        Err(e) => {
            log::error!(
                "[UPDATE_ACTIVITY] Activity not found: activity_id={activity_id}, error={e}"
            );
            return Err(e);
        }
    };

    // Update the activity
    match state.database.update_activity(activity_id, updates).await {
        Ok(updated_activity) => {
            log::info!(
                "[UPDATE_ACTIVITY] Success: updated activity_id={} for pet_id={}",
                activity_id,
                updated_activity.pet_id
            );
            log::debug!("[UPDATE_ACTIVITY] Response: {{\"id\": {}, \"pet_id\": {}, \"category\": \"{}\", \"subcategory\": \"{}\", \"updated_at\": \"{}\"}}", 
                updated_activity.id, updated_activity.pet_id, updated_activity.category, updated_activity.subcategory, updated_activity.updated_at
            );
            Ok(updated_activity)
        }
        Err(e) => {
            log::error!("[UPDATE_ACTIVITY] Database error: {e}");
            Err(e)
        }
    }
}

/// Get an activity by ID - backward compatible version (less secure)
#[tauri::command]
pub async fn get_activity(
    state: State<'_, AppState>,
    activity_id: i64,
) -> Result<Activity, ActivityError> {
    log::info!("[GET_ACTIVITY] Starting activity retrieval (legacy API)");
    log::debug!("[GET_ACTIVITY] Request params: {{\"activity_id\": {activity_id}}}");

    if activity_id <= 0 {
        log::error!("[GET_ACTIVITY] Invalid activity_id: {activity_id}");
        return Err(ActivityError::validation(
            "activity_id",
            "Activity ID must be positive",
        ));
    }

    match state.database.get_activity_by_id(activity_id).await {
        Ok(activity) => {
            log::info!(
                "[GET_ACTIVITY] Success: retrieved activity_id={} for pet_id={}",
                activity.id,
                activity.pet_id
            );
            log::debug!("[GET_ACTIVITY] Response: {{\"id\": {}, \"pet_id\": {}, \"category\": \"{}\", \"subcategory\": \"{}\", \"created_at\": \"{}\", \"activity_data_size\": {}}}", 
                activity.id, activity.pet_id, activity.category, activity.subcategory, activity.created_at,
                activity.activity_data.as_ref().map(|v| v.to_string().len()).unwrap_or(0)
            );
            Ok(activity)
        }
        Err(e) => {
            log::error!("[GET_ACTIVITY] Database error: activity_id={activity_id}, error={e}");
            Err(e)
        }
    }
}

/// Get activities for a specific pet (frontend-friendly version)
#[tauri::command]
pub async fn get_activities_for_pet(
    state: State<'_, AppState>,
    pet_id: i64,
) -> Result<Vec<Activity>, ActivityError> {
    log::info!("[GET_ACTIVITIES_FOR_PET] Starting activities retrieval for pet");
    log::debug!("[GET_ACTIVITIES_FOR_PET] Request params: {{\"pet_id\": {pet_id}}}");

    if pet_id <= 0 {
        log::error!("[GET_ACTIVITIES_FOR_PET] Invalid pet_id: {pet_id}");
        return Err(ActivityError::validation(
            "pet_id",
            "Pet ID must be positive",
        ));
    }

    // Verify pet exists
    if let Err(e) = state.database.get_pet_by_id(pet_id).await {
        log::error!("[GET_ACTIVITIES_FOR_PET] Pet not found: pet_id={pet_id}, error={e}");
        return Err(ActivityError::validation("pet_id", "Pet not found"));
    }

    let request = crate::database::GetActivitiesRequest {
        pet_id: Some(pet_id),
        category: None,
        start_date: None,
        end_date: None,
        sort_by: Some("created_at".to_string()),
        sort_desc: Some(true),
        limit: Some(100), // Default limit for frontend
        offset: Some(0),
    };

    match state.database.get_activities(request).await {
        Ok(result) => {
            log::info!(
                "[GET_ACTIVITIES_FOR_PET] Success: retrieved {} activities for pet_id={}",
                result.activities.len(),
                pet_id
            );
            log::debug!("[GET_ACTIVITIES_FOR_PET] Response: {{\"activities_count\": {}, \"activity_ids\": {:?}}}",
                result.activities.len(),
                result.activities.iter().take(5).map(|a| a.id).collect::<Vec<_>>()
            );
            Ok(result.activities)
        }
        Err(e) => {
            log::error!("[GET_ACTIVITIES_FOR_PET] Database error: pet_id={pet_id}, error={e}");
            Err(e)
        }
    }
}

/// Delete an activity - backward compatible version (less secure)
#[tauri::command]
pub async fn delete_activity(
    state: State<'_, AppState>,
    activity_id: i64,
) -> Result<(), ActivityError> {
    log::info!("[DELETE_ACTIVITY] Starting activity deletion (legacy API)");
    log::debug!("[DELETE_ACTIVITY] Request params: {{\"activity_id\": {activity_id}}}");

    if activity_id <= 0 {
        log::error!("[DELETE_ACTIVITY] Invalid activity_id: {activity_id}");
        return Err(ActivityError::validation(
            "activity_id",
            "Activity ID must be positive",
        ));
    }

    // Check if activity exists
    let activity = match state.database.get_activity_by_id(activity_id).await {
        Ok(activity) => {
            log::debug!(
                "[DELETE_ACTIVITY] Found activity: id={}, pet_id={}, category={}",
                activity.id,
                activity.pet_id,
                activity.category
            );
            activity
        }
        Err(e) => {
            log::error!(
                "[DELETE_ACTIVITY] Activity not found: activity_id={activity_id}, error={e}"
            );
            return Err(e);
        }
    };

    // Delete the activity
    match state.database.delete_activity(activity_id).await {
        Ok(_) => {
            log::info!(
                "[DELETE_ACTIVITY] Success: deleted activity_id={} for pet_id={}",
                activity_id,
                activity.pet_id
            );
            log::debug!("[DELETE_ACTIVITY] Response: {{\"deleted\": true}}");
            Ok(())
        }
        Err(e) => {
            log::error!("[DELETE_ACTIVITY] Database error: activity_id={activity_id}, error={e}");
            Err(e)
        }
    }
}
