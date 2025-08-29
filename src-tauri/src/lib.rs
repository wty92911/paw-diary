// Pet Management System modules
pub mod commands;
pub mod database;
pub mod errors;
pub mod photo;

use commands::*;
use log::Record;
use tauri_plugin_log::{Target, TargetKind};
// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {name}! You've been greeted from Rust!")
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let log_plugin = tauri_plugin_log::Builder::new()
        .targets([
            Target::new(TargetKind::LogDir {
                file_name: Some("paw-diary.stdout".to_string()),
            }),
            Target::new(TargetKind::Stdout),
            Target::new(TargetKind::Webview), // Logs to the browser console (if enabled)
        ])
        .format(
            |out: tauri_plugin_log::fern::FormatCallback, args, record: &Record| {
                let file = record.file().unwrap_or("unknown");
                let line = record.line().unwrap_or(0);
                out.finish(format_args!(
                    "[{} {} {}:{}] {}",
                    chrono::Local::now().format("%Y-%m-%d %H:%M:%S"),
                    record.level(),
                    file,
                    line,
                    args.to_string()
                ));
            },
        )
        .build();
    tauri::Builder::default()
        .plugin(log_plugin)
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
        .setup(|app| {
            log::info!("Tauri application setup started");
            // Don't initialize AppState here - let initialize_app command handle it
            log::info!("Tauri application setup complete");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
