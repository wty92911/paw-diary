use serde::{Deserialize, Serialize};

#[derive(Clone, Serialize, Deserialize)]
pub struct PhotoStoreDir(pub std::path::PathBuf);
