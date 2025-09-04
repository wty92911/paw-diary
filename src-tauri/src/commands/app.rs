use super::AppState;
use crate::errors::PetError;
use tauri::{AppHandle, Manager, State};

/// Initialize the application database and directories
#[tauri::command]
pub async fn initialize_app(app_handle: AppHandle) -> Result<String, PetError> {
    log::info!("=== STARTING APPLICATION INITIALIZATION ===");

    let app_data_dir = app_handle.path().app_data_dir().map_err(|e| {
        log::error!("Failed to get app data directory: {e}");
        PetError::file_system(format!("Failed to get app data directory: {e}"))
    })?;

    log::info!("App data directory: {}", app_data_dir.display());

    // Create app data directory if it doesn't exist
    if !app_data_dir.exists() {
        log::info!("Creating app data directory...");
        std::fs::create_dir_all(&app_data_dir).map_err(|e| {
            log::error!("Failed to create app data directory: {e}");
            PetError::file_system(format!("Failed to create app data directory: {e}"))
        })?;
        log::info!("App data directory created successfully");
    } else {
        log::info!("App data directory already exists");
    }

    let db_path = app_data_dir.join("pets.db");
    let photo_dir = app_data_dir.join("photos");

    log::info!("Database path: {}", db_path.display());
    log::info!("Photo directory: {}", photo_dir.display());

    // Create photo directory if it doesn't exist
    if !photo_dir.exists() {
        log::info!("Creating photo directory...");
        std::fs::create_dir_all(&photo_dir).map_err(|e| {
            log::error!("Failed to create photo directory: {e}");
            PetError::file_system(format!("Failed to create photo directory: {e}"))
        })?;
        log::info!("Photo directory created successfully");
    } else {
        log::info!("Photo directory already exists");
    }

    // Initialize application state (clone paths for later use)
    let app_state = AppState::new(db_path.clone(), photo_dir.clone()).await?;

    // Test database connection
    log::info!("Testing database connection...");
    let total_pets = app_state.database.get_pets(true).await?.len();
    let active_pets = app_state.database.get_pets(false).await?.len();

    log::info!(
        "Database connection successful - Total pets: {total_pets}, Active pets: {active_pets}"
    );

    // Store app state in Tauri's managed state
    app_handle.manage(app_state);

    log::info!("=== APPLICATION INITIALIZATION COMPLETE ===");
    Ok(format!(
        "Application initialized successfully. Database: {}, Photos: {}",
        db_path.display(),
        photo_dir.display()
    ))
}

/// Get application statistics
#[tauri::command]
pub async fn get_app_statistics(state: State<'_, AppState>) -> Result<AppStatistics, PetError> {
    log::debug!("Getting application statistics");

    let total_pets = state.database.get_pets(true).await?.len();
    let active_pets = state.database.get_pets(false).await?.len();
    let archived_pets = total_pets - active_pets;

    let photo_stats = state.photo_service.get_storage_stats()?;

    Ok(AppStatistics {
        total_pets,
        active_pets,
        archived_pets,
        total_photos: photo_stats.photo_count,
        total_photo_size: photo_stats.total_size,
    })
}

/// Application statistics data structure
#[derive(serde::Serialize, serde::Deserialize)]
pub struct AppStatistics {
    pub total_pets: usize,
    pub active_pets: usize,
    pub archived_pets: usize,
    pub total_photos: usize,
    pub total_photo_size: u64,
}
