use tauri::{
    http::{Request, Response},
    AppHandle, Manager, State,
};

use crate::commands::AppState;

/// Handle requests to the custom photos:// protocol
///
/// For macos, iOS and Linux, the URL format is: photos://localhost/filename.jpg
///
/// For windows and android, the URL format is: http://photos.localhost/filename.jpg
///
/// Extract filename from URL and get the photo from the photo service
/// (photos://localhost/filename.jpg -> filename.jpg)
///
pub async fn handle_photos_protocol_request(
    app: &AppHandle,
    request: Request<Vec<u8>>,
) -> Result<Response<Vec<u8>>, Box<dyn std::error::Error + Send + Sync>> {
    let uri = request.uri();

    // parse the url after "localhost/" as the filename
    let path = uri.path();

    log::info!("handle_photos_protocol_request: uri: {uri}, path: {path}");

    // Remove leading slash if present
    let filename = if let Some(p) = path.strip_prefix("/") {
        p
    } else {
        path
    };

    log::info!("handle_photos_protocol_request: filename: {filename}");
    // Validate filename is not empty
    if filename.is_empty() {
        return Err("Empty filename".into());
    }

    // Validate filename for security (prevent path traversal)
    if filename.contains("..") || filename.contains('/') || filename.contains('\\') {
        return Err("Invalid filename".into());
    }

    // Get the app state
    let app_state: State<AppState> = app.state();

    // Get photo path from photo service
    let photo_path = app_state
        .photo_service
        .get_photo_path(filename)
        .map_err(|e| format!("Failed to get photo path: {e}"))?;

    log::info!(
        "handle_photos_protocol_request: photo_path: {}",
        photo_path.to_string_lossy()
    );
    // 读字节并返回
    let bytes = std::fs::read(&photo_path).map_err(|e| format!("read photo failed: {e}"))?;

    let mime = mime_guess::from_path(&photo_path).first_or_octet_stream();

    let resp = Response::builder()
        .status(200)
        .header("Content-Type", mime.as_ref())
        .header("Cache-Control", "public, max-age=31536000, immutable")
        .body(bytes)?;
    Ok(resp)
}
