use log::Record;
use tauri::plugin::TauriPlugin;
use tauri::Wry;
use tauri_plugin_log::{Target, TargetKind};

pub fn get_log_plugin() -> TauriPlugin<Wry> {
    tauri_plugin_log::Builder::new()
        .targets([
            Target::new(TargetKind::LogDir {
                file_name: Some("paw-diary.stdout".to_string()),
            }),
            Target::new(TargetKind::Stdout),
            Target::new(TargetKind::Webview), // Logs to the browser console (if enabled)
        ])
        .level(log::LevelFilter::Info) // Set global log level to Info (filters out DEBUG and TRACE)
        .filter(|metadata| {
            // Filter out noisy dependencies
            let target = metadata.target();

            // Allow our application logs
            if target.starts_with("paw_diary") || target.starts_with("paw-diary") {
                return true;
            }

            // Filter out verbose dependency logs
            match target {
                // Hyper HTTP client logs
                t if t.starts_with("hyper") => metadata.level() <= log::Level::Warn,
                t if t.starts_with("hyper_util") => metadata.level() <= log::Level::Warn,

                // Tokio runtime logs
                t if t.starts_with("tokio") => metadata.level() <= log::Level::Warn,

                // Tao (Tauri's windowing library) logs
                t if t.starts_with("tao") => metadata.level() <= log::Level::Warn,

                // WRY (Tauri's webview library) logs
                t if t.starts_with("wry") => metadata.level() <= log::Level::Warn,

                // Allow Tauri core logs at Info level
                t if t.starts_with("tauri") => metadata.level() <= log::Level::Info,

                // For other dependencies, only show warnings and errors
                _ => metadata.level() <= log::Level::Warn,
            }
        })
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
                    args
                ));
            },
        )
        .build()
}
