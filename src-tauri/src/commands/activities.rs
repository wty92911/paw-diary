use super::AppState;
use crate::database::{
    Activity, ActivityCreateRequest, ActivityFilters, ActivitySearchResult, ActivityStatsResponse,
    ActivityUpdateRequest, ExportActivitiesRequest, GetActivitiesResponse, SearchActivitiesRequest,
};
use crate::errors::ActivityError;
use crate::validation;
use chrono::{DateTime, Utc};
use tauri::State;

/// Create a new activity
#[tauri::command]
pub async fn create_activity(
    state: State<'_, AppState>,
    activity_data: ActivityCreateRequest,
) -> Result<Activity, ActivityError> {
    log::info!(
        "Creating new activity: {} for pet {}",
        activity_data.title,
        activity_data.pet_id
    );

    // Validate input data
    validation::validate_activity_create_request(&activity_data)?;

    // Verify pet exists
    if let Err(_) = state.database.get_pet_by_id(activity_data.pet_id).await {
        return Err(ActivityError::validation("pet_id", "Pet not found"));
    }

    let activity = state.database.create_activity(activity_data).await?;

    log::info!("Activity created successfully with ID: {}", activity.id);
    Ok(activity)
}

/// Update an existing activity
#[tauri::command]
pub async fn update_activity(
    state: State<'_, AppState>,
    activity_id: i64,
    updates: ActivityUpdateRequest,
) -> Result<Activity, ActivityError> {
    log::info!("Updating activity with ID: {activity_id}");

    if activity_id <= 0 {
        return Err(ActivityError::validation(
            "activity_id",
            "Activity ID must be positive",
        ));
    }

    // Validate update data
    validation::validate_activity_update_request(&updates)?;

    // Check if activity exists
    let _existing_activity = state.database.get_activity_by_id(activity_id).await?;

    // Update the activity
    let updated_activity = state.database.update_activity(activity_id, updates).await?;

    log::info!("Activity updated successfully: {}", updated_activity.title);
    Ok(updated_activity)
}

/// Get an activity by ID
#[tauri::command]
pub async fn get_activity(
    state: State<'_, AppState>,
    activity_id: i64,
) -> Result<Activity, ActivityError> {
    log::info!("Getting activity with ID: {activity_id}");

    if activity_id <= 0 {
        return Err(ActivityError::validation(
            "activity_id",
            "Activity ID must be positive",
        ));
    }

    let activity = state.database.get_activity_by_id(activity_id).await?;

    log::info!("Activity retrieved: {}", activity.title);
    Ok(activity)
}

/// Get activities for a pet with optional filters and pagination
#[tauri::command]
pub async fn get_activities(
    state: State<'_, AppState>,
    pet_id: i64,
    filters: Option<ActivityFilters>,
    limit: Option<i64>,
    offset: Option<i64>,
) -> Result<GetActivitiesResponse, ActivityError> {
    log::info!("Getting activities for pet ID: {pet_id} (limit: {limit:?}, offset: {offset:?})");

    if pet_id <= 0 {
        return Err(ActivityError::validation(
            "pet_id",
            "Pet ID must be positive",
        ));
    }

    // Verify pet exists
    if let Err(_) = state.database.get_pet_by_id(pet_id).await {
        return Err(ActivityError::validation("pet_id", "Pet not found"));
    }

    let limit = limit.unwrap_or(20).max(1).min(100); // Default 20, max 100
    let _offset = offset.unwrap_or(0).max(0);

    let request = crate::database::GetActivitiesRequest {
        pet_id: Some(pet_id),
        category: None,
        start_date: filters.as_ref().and_then(|f| f.date_from),
        end_date: filters.as_ref().and_then(|f| f.date_to),
        sort_by: Some("created_at".to_string()),
        sort_desc: Some(true),
        limit: Some(limit),
        offset: Some(offset.unwrap_or(0)),
    };

    let result = state.database.get_activities(request).await?;

    log::info!(
        "Retrieved {} activities for pet {}",
        result.activities.len(),
        pet_id
    );
    Ok(result)
}

/// Search activities across all pets (or specific pet) with text search
#[tauri::command]
pub async fn search_activities(
    state: State<'_, AppState>,
    search_query: String,
    pet_id: Option<i64>,
    limit: Option<i64>,
    offset: Option<i64>,
) -> Result<ActivitySearchResult, ActivityError> {
    log::info!("Searching activities with query: '{search_query}' for pet: {pet_id:?}");

    if search_query.trim().is_empty() {
        return Err(ActivityError::validation(
            "search_query",
            "Search query cannot be empty",
        ));
    }

    if let Some(pid) = pet_id {
        if pid <= 0 {
            return Err(ActivityError::validation(
                "pet_id",
                "Pet ID must be positive",
            ));
        }

        // Verify pet exists
        if let Err(_) = state.database.get_pet_by_id(pid).await {
            return Err(ActivityError::validation("pet_id", "Pet not found"));
        }
    }

    let limit = limit.unwrap_or(20).max(1).min(100);
    let _offset = offset.unwrap_or(0).max(0);

    let request = SearchActivitiesRequest {
        pet_id,
        query: search_query.trim().to_string(),
        limit: Some(limit),
    };

    let activities = state.database.search_activities(request).await?;

    let result = ActivitySearchResult {
        activities: activities.clone(),
        total_count: activities.len() as i64, // This is simplified - in a real app you'd need a separate count query
        has_more: activities.len() == limit as usize,
    };

    log::info!(
        "Found {} activities matching search query",
        result.activities.len()
    );
    Ok(result)
}

/// Delete an activity
#[tauri::command]
pub async fn delete_activity(
    state: State<'_, AppState>,
    activity_id: i64,
) -> Result<(), ActivityError> {
    log::info!("Deleting activity with ID: {activity_id}");

    if activity_id <= 0 {
        return Err(ActivityError::validation(
            "activity_id",
            "Activity ID must be positive",
        ));
    }

    // Check if activity exists
    let _activity = state.database.get_activity_by_id(activity_id).await?;

    // Delete the activity
    state.database.delete_activity(activity_id).await?;

    log::info!("Activity deleted successfully: {activity_id}");
    Ok(())
}

/// Get activity statistics for a pet
#[tauri::command]
pub async fn get_activity_stats(
    state: State<'_, AppState>,
    pet_id: i64,
    date_from: Option<DateTime<Utc>>,
    date_to: Option<DateTime<Utc>>,
) -> Result<ActivityStatsResponse, ActivityError> {
    log::info!("Getting activity statistics for pet ID: {pet_id}");

    if pet_id <= 0 {
        return Err(ActivityError::validation(
            "pet_id",
            "Pet ID must be positive",
        ));
    }

    // Verify pet exists
    if let Err(_) = state.database.get_pet_by_id(pet_id).await {
        return Err(ActivityError::validation("pet_id", "Pet not found"));
    }

    // Convert date range to days
    let days = if let (Some(from), Some(_to)) = (date_from, date_to) {
        let now = Utc::now();
        Some((now - from).num_days())
    } else {
        None
    };

    let stats = state.database.get_activity_stats(pet_id, days).await?;

    log::info!("Retrieved activity statistics for pet {pet_id}");
    Ok(stats)
}

/// Get recent activities across all pets (for timeline view)
#[tauri::command]
pub async fn get_recent_activities(
    state: State<'_, AppState>,
    limit: Option<i64>,
    offset: Option<i64>,
) -> Result<ActivitySearchResult, ActivityError> {
    log::info!("Getting recent activities (limit: {limit:?}, offset: {offset:?})");

    let limit = limit.unwrap_or(20).max(1).min(100);
    let _offset = offset.unwrap_or(0).max(0);

    let activities = state
        .database
        .get_recent_activities(None, Some(limit))
        .await?;

    let result = ActivitySearchResult {
        activities: activities.clone(),
        total_count: activities.len() as i64, // Simplified
        has_more: activities.len() == limit as usize,
    };

    log::info!("Retrieved {} recent activities", result.activities.len());
    Ok(result)
}

/// Get activities by category across all pets
#[tauri::command]
pub async fn get_activities_by_category(
    state: State<'_, AppState>,
    pet_id: i64,
    category: String,
    limit: Option<i64>,
    offset: Option<i64>,
) -> Result<ActivitySearchResult, ActivityError> {
    log::info!("Getting activities by category: {category} for pet: {pet_id}");

    if pet_id <= 0 {
        return Err(ActivityError::validation(
            "pet_id",
            "Pet ID must be positive",
        ));
    }

    // Parse and validate category
    let activity_category = category
        .parse()
        .map_err(|_| ActivityError::invalid_type(&category))?;

    let limit = limit.unwrap_or(20).max(1).min(100);
    let _offset = offset.unwrap_or(0).max(0); // Not used by database method

    let activities = state
        .database
        .get_activities_by_category(pet_id, activity_category, Some(limit))
        .await?;

    let result = ActivitySearchResult {
        activities: activities.clone(),
        total_count: activities.len() as i64, // Simplified
        has_more: activities.len() == limit as usize,
    };

    log::info!(
        "Retrieved {} activities for category {}",
        result.activities.len(),
        category
    );
    Ok(result)
}

/// Export activities for a pet (for backup/sync)
#[tauri::command]
pub async fn export_activities(
    state: State<'_, AppState>,
    pet_id: i64,
) -> Result<Vec<Activity>, ActivityError> {
    log::info!("Exporting activities for pet ID: {pet_id}");

    if pet_id <= 0 {
        return Err(ActivityError::validation(
            "pet_id",
            "Pet ID must be positive",
        ));
    }

    // Verify pet exists
    if let Err(_) = state.database.get_pet_by_id(pet_id).await {
        return Err(ActivityError::validation("pet_id", "Pet not found"));
    }

    let request = ExportActivitiesRequest {
        pet_id: Some(pet_id),
        ..Default::default()
    };
    let activities = state.database.export_activities(request).await?;

    log::info!(
        "Exported {} activities for pet {}",
        activities.len(),
        pet_id
    );
    Ok(activities)
}

// Full-Text Search Commands

/// Search activities using FTS (Full-Text Search)
#[tauri::command]
pub async fn fts_search_activities(
    state: State<'_, AppState>,
    query: String,
    limit: Option<i64>,
) -> Result<Vec<crate::database::fts::FtsSearchResult>, ActivityError> {
    log::info!("FTS search: query='{query}', limit={limit:?}");

    if query.trim().is_empty() {
        return Err(ActivityError::validation(
            "query",
            "Search query cannot be empty",
        ));
    }

    state.database.fts_search_activities(&query, limit).await
}

/// Rebuild the FTS index from scratch
#[tauri::command]
pub async fn rebuild_fts_index(
    state: State<'_, AppState>,
) -> Result<crate::database::fts::FtsIndexStats, ActivityError> {
    log::info!("Rebuilding FTS index");
    state.database.rebuild_fts_index().await
}

/// Get FTS index statistics
#[tauri::command]
pub async fn get_fts_index_stats(
    state: State<'_, AppState>,
) -> Result<crate::database::fts::FtsIndexStats, ActivityError> {
    log::debug!("Getting FTS index statistics");
    state.database.get_fts_index_stats().await
}

/// Verify FTS index integrity
#[tauri::command]
pub async fn verify_fts_integrity(
    state: State<'_, AppState>,
) -> Result<crate::database::fts::FtsIntegrityResult, ActivityError> {
    log::info!("Verifying FTS index integrity");
    state.database.verify_fts_integrity().await
}

/// Repair FTS index inconsistencies
#[tauri::command]
pub async fn repair_fts_index(
    state: State<'_, AppState>,
) -> Result<crate::database::fts::FtsRepairResult, ActivityError> {
    log::info!("Repairing FTS index");
    state.database.repair_fts_index().await
}
