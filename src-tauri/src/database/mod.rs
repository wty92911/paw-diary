pub mod activities;
pub mod fts;
pub mod models;
pub mod pets;

pub use models::*;

use anyhow::Result;
use sqlx::sqlite::{SqliteConnectOptions, SqliteJournalMode, SqlitePool, SqliteSynchronous};
use std::{path::Path, str::FromStr};

/// Main database instance that combines all modules
pub struct PetDatabase {
    pub pool: SqlitePool,
}

impl PetDatabase {
    /// Create a new database instance
    pub async fn new<P: AsRef<Path>>(database_path: P) -> Result<Self> {
        let database_url = format!("sqlite:{}", database_path.as_ref().display());

        // Configure SQLite connection options
        let options = SqliteConnectOptions::from_str(&database_url)?
            .create_if_missing(true)
            .journal_mode(SqliteJournalMode::Wal)
            .synchronous(SqliteSynchronous::Normal);

        let pool = SqlitePool::connect_with(options).await?;

        // Run migrations
        sqlx::migrate!("./migrations").run(&pool).await?;

        Ok(PetDatabase { pool })
    }

    /// Create a new database instance for testing
    #[cfg(test)]
    pub async fn new_for_test(database_path: &str) -> Result<Self> {
        Self::new(database_path).await
    }
}
