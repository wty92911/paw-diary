pub mod app;
pub mod pets;
pub mod photos;

// Re-export all commands for easy access
pub use app::*;
pub use pets::*;
pub use photos::*;

use crate::database::PetDatabase;
use crate::errors::PetError;
use crate::photo::PhotoService;
use std::path::PathBuf;
use std::sync::Arc;

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
