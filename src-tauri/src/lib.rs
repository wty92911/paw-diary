// Pet Management System modules
pub mod commands;
pub mod database;
pub mod errors;
pub mod logger;
pub mod photo;
pub mod protocol;
pub mod validation;

use commands::*;
use tauri::http::Response;
// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {name}! You've been greeted from Rust!")
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(logger::get_log_plugin())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            // Original demo command
            greet,
            // Application initialization
            initialize_app,
            get_app_statistics,
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
            list_pet_photos,
            get_photo_storage_stats,
            // Activity management commands
            create_activity,
            update_activity,
            get_activity,
            get_activities,
            search_activities,
            delete_activity,
            get_activity_stats,
            get_recent_activities,
            get_activities_by_category,
            export_activities,
            // Full-Text Search commands
            fts_search_activities,
            rebuild_fts_index,
            get_fts_index_stats,
            verify_fts_integrity,
            repair_fts_index
        ])
        .register_asynchronous_uri_scheme_protocol("photos", move |app, request, responder| {
            let app_handle = app.app_handle().clone();
            tauri::async_runtime::spawn(async move {
                match protocol::handle_photos_protocol_request(&app_handle, request).await {
                    Ok(response) => responder.respond(response),
                    Err(e) => {
                        log::error!("Photos protocol error: {e}");
                        responder.respond(Response::builder().status(404).body(Vec::new()).unwrap())
                    }
                }
            });
        })
        .setup(|_app| {
            log::info!("Tauri application setup started");
            // Don't initialize AppState here - let initialize_app command handle it
            log::info!("Tauri application setup complete");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
