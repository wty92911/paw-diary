// Pet Management System modules
pub mod database;
pub mod errors;
pub mod photo;
pub mod commands;

use commands::*;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize logging
    env_logger::init();
    log::info!("Starting Paw Diary application");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            // Original demo command
            greet,
            
            // Application initialization
            initialize_app,
            get_app_info,
            
            // Pet management commands
            create_pet,
            get_pets,
            get_pet_by_id,
            update_pet,
            delete_pet,
            reorder_pets,
            
            // Photo management commands
            upload_pet_photo,
            upload_pet_photo_from_path,
            delete_pet_photo,
            get_pet_photo_info,
            get_pet_photo_path,
            list_pet_photos,
            get_photo_storage_stats
        ])
        .setup(|_app| {
            log::info!("Tauri application setup complete");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
