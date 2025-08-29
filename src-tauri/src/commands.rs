use crate::database::{Pet, PetCreateRequest, PetDatabase, PetUpdateRequest};
use crate::errors::{validation, PetError};
use crate::photo::{PhotoInfo, PhotoService, StorageStats};
use std::path::PathBuf;
use std::sync::Arc;
use tauri::{AppHandle, Manager, State};

/// Application state containing database and photo service
pub struct AppState {
    pub database: Arc<PetDatabase>,
    pub photo_service: Arc<PhotoService>,
}

impl AppState {
    pub async fn new(db_path: PathBuf, photo_dir: PathBuf) -> Result<Self, PetError> {
        let database: Arc<PetDatabase> = Arc::new(PetDatabase::new(db_path).await?);
        let photo_service = Arc::new(PhotoService::new(photo_dir)?);

        Ok(AppState {
            database,
            photo_service,
        })
    }
}

/// Create a new pet
#[tauri::command]
pub async fn create_pet(
    state: State<'_, AppState>,
    pet_data: PetCreateRequest,
) -> Result<Pet, PetError> {
    log::info!("Creating new pet: {}", pet_data.name);

    // Validate input data
    validation::validate_pet_create_request(&pet_data)?;

    // Create pet in database
    let pet = state.database.create_pet(pet_data).await?;

    log::info!("Successfully created pet with ID: {}", pet.id);
    Ok(pet)
}

/// Get all pets, optionally including archived ones
#[tauri::command]
pub async fn get_pets(
    state: State<'_, AppState>,
    include_archived: bool,
) -> Result<Vec<Pet>, PetError> {
    log::debug!("Fetching pets (include_archived: {include_archived})");

    let pets = state.database.get_pets(include_archived).await?;

    log::debug!("Retrieved {} pets", pets.len());
    Ok(pets)
}

/// Get a specific pet by ID
#[tauri::command]
pub async fn get_pet_by_id(state: State<'_, AppState>, id: i64) -> Result<Pet, PetError> {
    log::debug!("Fetching pet with ID: {id}");

    if id <= 0 {
        return Err(PetError::invalid_input("Pet ID must be positive"));
    }

    let pet = state.database.get_pet_by_id(id).await?;

    log::debug!("Retrieved pet: {}", pet.name);
    Ok(pet)
}

/// Update an existing pet
#[tauri::command]
pub async fn update_pet(
    state: State<'_, AppState>,
    id: i64,
    pet_data: PetUpdateRequest,
) -> Result<Pet, PetError> {
    log::info!("Updating pet with ID: {id}");

    if id <= 0 {
        return Err(PetError::invalid_input("Pet ID must be positive"));
    }

    // Validate input data
    validation::validate_pet_update_request(&pet_data)?;

    let pet = state.database.update_pet(id, pet_data).await?;

    log::info!("Successfully updated pet: {}", pet.name);
    Ok(pet)
}

/// Delete a pet (soft delete by archiving)
#[tauri::command]
pub async fn delete_pet(state: State<'_, AppState>, id: i64) -> Result<(), PetError> {
    log::info!("Deleting (archiving) pet with ID: {id}");

    if id <= 0 {
        return Err(PetError::invalid_input("Pet ID must be positive"));
    }

    state.database.delete_pet(id).await?;

    log::info!("Successfully deleted pet with ID: {id}");
    Ok(())
}

/// Reorder pets by updating their display_order
#[tauri::command]
pub async fn reorder_pets(state: State<'_, AppState>, pet_ids: Vec<i64>) -> Result<(), PetError> {
    log::info!("Reordering {} pets", pet_ids.len());

    // Validate input
    validation::validate_reorder_list(&pet_ids)?;

    state.database.reorder_pets(pet_ids).await?;

    log::info!("Successfully reordered pets");
    Ok(())
}

/// Upload and process a pet photo
#[tauri::command]
pub async fn upload_pet_photo(
    state: State<'_, AppState>,
    image_data: Vec<u8>,
    original_filename: Option<String>,
) -> Result<String, PetError> {
    log::info!("Uploading pet photo (size: {} bytes)", image_data.len());

    if image_data.is_empty() {
        return Err(PetError::invalid_input("Image data cannot be empty"));
    }

    if image_data.len() > 10_485_760 {
        // 10MB limit
        return Err(PetError::resource_limit("Image file too large (max 10MB)"));
    }

    // Extract file extension from original filename
    let extension = original_filename
        .as_ref()
        .and_then(|name| name.split('.').next_back())
        .map(|ext| ext.to_lowercase());

    // Validate extension
    let valid_extensions = ["jpg", "jpeg", "png", "webp", "bmp", "tiff", "tif"];
    if let Some(ref ext) = extension {
        if !valid_extensions.contains(&ext.as_str()) {
            return Err(PetError::invalid_input(format!(
                "Unsupported image format: {ext}"
            )));
        }
    }

    let filename = state
        .photo_service
        .store_photo_from_bytes(&image_data, extension.as_deref())?;

    log::info!("Successfully uploaded pet photo: {filename}");
    Ok(filename)
}

/// Upload pet photo from file path
#[tauri::command]
pub async fn upload_pet_photo_from_path(
    state: State<'_, AppState>,
    file_path: String,
) -> Result<String, PetError> {
    log::info!("Uploading pet photo from path: {file_path}");

    if file_path.trim().is_empty() {
        return Err(PetError::invalid_input("File path cannot be empty"));
    }

    let path = PathBuf::from(&file_path);
    if !path.exists() {
        return Err(PetError::file_system("Photo file does not exist"));
    }

    let filename = state.photo_service.store_photo(&path)?;

    log::info!("Successfully uploaded pet photo from path: {filename}");
    Ok(filename)
}

/// Delete a pet photo
#[tauri::command]
pub async fn delete_pet_photo(
    state: State<'_, AppState>,
    photo_filename: String,
) -> Result<(), PetError> {
    log::info!("Deleting pet photo: {photo_filename}");

    if photo_filename.trim().is_empty() {
        return Err(PetError::invalid_input("Photo filename cannot be empty"));
    }

    state.photo_service.delete_photo(&photo_filename)?;

    log::info!("Successfully deleted pet photo: {photo_filename}");
    Ok(())
}

/// Get pet photo information
#[tauri::command]
pub async fn get_pet_photo_info(
    state: State<'_, AppState>,
    photo_filename: String,
) -> Result<PhotoInfo, PetError> {
    log::debug!("Getting photo info for: {photo_filename}");

    if photo_filename.trim().is_empty() {
        return Err(PetError::invalid_input("Photo filename cannot be empty"));
    }

    let info = state.photo_service.get_photo_info(&photo_filename)?;

    log::debug!("Retrieved photo info for: {photo_filename}");
    Ok(info)
}

/// List all stored pet photos
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

    // Initialize app state
    log::info!("Creating AppState...");
    let app_state = AppState::new(db_path.clone(), photo_dir)
        .await
        .map_err(|e| {
            log::error!("Failed to create AppState: {e}");
            e
        })?;

    log::info!("Managing AppState with Tauri...");
    app_handle.manage(app_state);

    let db_path_str = db_path.to_string_lossy().to_string();
    log::info!("=== APPLICATION INITIALIZATION COMPLETE ===");
    log::info!("Database location: {db_path_str}");

    Ok(db_path_str)
}

/// Get application information and health status
#[tauri::command]
pub async fn get_app_info(state: State<'_, AppState>) -> Result<AppInfo, PetError> {
    log::debug!("Getting application information");

    // Get database stats
    let total_pets = state.database.get_pets(true).await?.len();
    let active_pets = state.database.get_pets(false).await?.len();

    // Get photo storage stats
    let storage_stats = state.photo_service.get_storage_stats()?;

    let app_info = AppInfo {
        total_pets,
        active_pets,
        archived_pets: total_pets - active_pets,
        total_photos: storage_stats.photo_count,
        storage_size: storage_stats.total_size,
        storage_path: storage_stats.storage_dir,
        version: env!("CARGO_PKG_VERSION").to_string(),
    };

    log::debug!(
        "App info - Pets: {}/{}, Photos: {}, Storage: {} bytes",
        active_pets,
        total_pets,
        app_info.total_photos,
        app_info.storage_size
    );

    Ok(app_info)
}

/// Application information structure
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct AppInfo {
    pub total_pets: usize,
    pub active_pets: usize,
    pub archived_pets: usize,
    pub total_photos: usize,
    pub storage_size: u64,
    pub storage_path: String,
    pub version: String,
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::database::{PetGender, PetSpecies};
    use chrono::NaiveDate;
    use tempfile::TempDir;

    async fn setup_test_app_state() -> (AppState, TempDir) {
        let temp_dir = TempDir::new().expect("Failed to create temp directory");
        let photo_dir = temp_dir.path().join("photos");

        // Use in-memory database for tests to avoid migration file dependencies
        let database = Arc::new(
            crate::database::PetDatabase::new_for_test(":memory:")
                .await
                .expect("Failed to create test database"),
        );
        let photo_service = Arc::new(
            crate::photo::PhotoService::new(photo_dir).expect("Failed to create photo service"),
        );

        let app_state = AppState {
            database,
            photo_service,
        };
        (app_state, temp_dir)
    }

    #[tokio::test]
    async fn test_create_and_get_pet() {
        let (app_state, _temp_dir) = setup_test_app_state().await;

        let pet_data = PetCreateRequest {
            name: "Test Pet".to_string(),
            birth_date: NaiveDate::from_ymd_opt(2020, 1, 1).unwrap(),
            species: PetSpecies::Cat,
            gender: PetGender::Female,
            breed: Some("Persian".to_string()),
            color: Some("White".to_string()),
            weight_kg: Some(5.0),
            photo_path: None,
            notes: Some("Test notes".to_string()),
            display_order: None,
        };

        // Test business logic directly
        let created_pet = app_state.database.create_pet(pet_data).await.unwrap();
        assert_eq!(created_pet.name, "Test Pet");
        assert_eq!(created_pet.species, PetSpecies::Cat);

        // Get pet by ID
        let retrieved_pet = app_state
            .database
            .get_pet_by_id(created_pet.id)
            .await
            .unwrap();
        assert_eq!(retrieved_pet.id, created_pet.id);
        assert_eq!(retrieved_pet.name, created_pet.name);
    }

    #[tokio::test]
    async fn test_get_pets() {
        let (app_state, _temp_dir) = setup_test_app_state().await;

        // Initially should be empty
        let pets = app_state.database.get_pets(false).await.unwrap();
        assert_eq!(pets.len(), 0);

        // Create a pet
        let pet_data = PetCreateRequest {
            name: "Test Pet".to_string(),
            birth_date: NaiveDate::from_ymd_opt(2021, 1, 1).unwrap(),
            species: PetSpecies::Dog,
            gender: PetGender::Male,
            breed: None,
            color: None,
            weight_kg: None,
            photo_path: None,
            notes: None,
            display_order: None,
        };

        app_state.database.create_pet(pet_data).await.unwrap();

        // Should now have one pet
        let pets = app_state.database.get_pets(false).await.unwrap();
        assert_eq!(pets.len(), 1);
        assert_eq!(pets[0].name, "Test Pet");
    }

    #[tokio::test]
    async fn test_update_pet() {
        let (app_state, _temp_dir) = setup_test_app_state().await;

        // Create a pet
        let pet_data = PetCreateRequest {
            name: "Original Name".to_string(),
            birth_date: NaiveDate::from_ymd_opt(2020, 1, 1).unwrap(),
            species: PetSpecies::Cat,
            gender: PetGender::Unknown,
            breed: None,
            color: None,
            weight_kg: Some(3.0),
            photo_path: None,
            notes: None,
            display_order: None,
        };

        let created_pet = app_state.database.create_pet(pet_data).await.unwrap();

        // Update the pet
        let update_data = PetUpdateRequest {
            name: Some("Updated Name".to_string()),
            weight_kg: Some(4.5),
            breed: Some("Siamese".to_string()),
            ..Default::default()
        };

        let updated_pet = app_state
            .database
            .update_pet(created_pet.id, update_data)
            .await
            .unwrap();
        assert_eq!(updated_pet.name, "Updated Name");
        assert_eq!(updated_pet.weight_kg, Some(4.5));
        assert_eq!(updated_pet.breed, Some("Siamese".to_string()));
        assert_eq!(updated_pet.species, PetSpecies::Cat); // Should remain unchanged
    }

    #[tokio::test]
    async fn test_delete_pet() {
        let (app_state, _temp_dir) = setup_test_app_state().await;

        // Create a pet
        let pet_data = PetCreateRequest {
            name: "To Delete".to_string(),
            birth_date: NaiveDate::from_ymd_opt(2020, 1, 1).unwrap(),
            species: PetSpecies::Dog,
            gender: PetGender::Male,
            breed: None,
            color: None,
            weight_kg: None,
            photo_path: None,
            notes: None,
            display_order: None,
        };

        let created_pet = app_state.database.create_pet(pet_data).await.unwrap();

        // Delete the pet
        let result = app_state.database.delete_pet(created_pet.id).await;
        assert!(result.is_ok());

        // Should not appear in active pets
        let active_pets = app_state.database.get_pets(false).await.unwrap();
        assert_eq!(active_pets.len(), 0);

        // Should appear in all pets (archived)
        let all_pets = app_state.database.get_pets(true).await.unwrap();
        assert_eq!(all_pets.len(), 1);
        assert!(all_pets[0].is_archived);
    }

    #[tokio::test]
    async fn test_reorder_pets() {
        let (app_state, _temp_dir) = setup_test_app_state().await;

        // Create multiple pets
        let pet1 = app_state
            .database
            .create_pet(PetCreateRequest {
                name: "Pet1".to_string(),
                birth_date: NaiveDate::from_ymd_opt(2020, 1, 1).unwrap(),
                species: PetSpecies::Cat,
                gender: PetGender::Male,
                breed: None,
                color: None,
                weight_kg: None,
                photo_path: None,
                notes: None,
                display_order: None,
            })
            .await
            .unwrap();

        let pet2 = app_state
            .database
            .create_pet(PetCreateRequest {
                name: "Pet2".to_string(),
                birth_date: NaiveDate::from_ymd_opt(2020, 1, 1).unwrap(),
                species: PetSpecies::Dog,
                gender: PetGender::Female,
                breed: None,
                color: None,
                weight_kg: None,
                photo_path: None,
                notes: None,
                display_order: None,
            })
            .await
            .unwrap();

        // Reorder pets
        let result = app_state
            .database
            .reorder_pets(vec![pet2.id, pet1.id])
            .await;
        assert!(result.is_ok());

        // Verify order changed
        let pets = app_state.database.get_pets(false).await.unwrap();
        assert_eq!(pets.len(), 2);
        assert_eq!(pets[0].name, "Pet2");
        assert_eq!(pets[1].name, "Pet1");
    }

    #[tokio::test]
    async fn test_validation_errors() {
        let (_app_state, _temp_dir) = setup_test_app_state().await;

        // Test empty name validation
        let invalid_pet_data = PetCreateRequest {
            name: "".to_string(), // Invalid empty name
            birth_date: NaiveDate::from_ymd_opt(2020, 1, 1).unwrap(),
            species: PetSpecies::Cat,
            gender: PetGender::Male,
            breed: None,
            color: None,
            weight_kg: None,
            photo_path: None,
            notes: None,
            display_order: None,
        };

        let result = validation::validate_pet_create_request(&invalid_pet_data);
        assert!(result.is_err());
    }
}
