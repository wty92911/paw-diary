use anyhow::Result;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{
    sqlite::{SqliteConnectOptions, SqliteJournalMode, SqlitePool, SqliteSynchronous},
    Row,
};
use std::{path::Path, str::FromStr};

/// Pet data structure matching the database schema
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Pet {
    pub id: i64,
    pub name: String,
    pub birth_date: chrono::NaiveDate,
    pub species: PetSpecies,
    pub gender: PetGender,
    pub breed: Option<String>,
    pub color: Option<String>,
    pub weight_kg: Option<f32>,
    pub photo_path: Option<String>,
    pub notes: Option<String>,
    pub display_order: i64,
    pub is_archived: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Pet species enum
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum PetSpecies {
    Cat,
    Dog,
}

impl std::fmt::Display for PetSpecies {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            PetSpecies::Cat => write!(f, "cat"),
            PetSpecies::Dog => write!(f, "dog"),
        }
    }
}

impl std::str::FromStr for PetSpecies {
    type Err = anyhow::Error;

    fn from_str(s: &str) -> Result<Self> {
        match s.to_lowercase().as_str() {
            "cat" => Ok(PetSpecies::Cat),
            "dog" => Ok(PetSpecies::Dog),
            _ => Err(anyhow::anyhow!("Invalid species: {}", s)),
        }
    }
}

/// Pet gender enum
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum PetGender {
    Male,
    Female,
    Unknown,
}

impl std::fmt::Display for PetGender {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            PetGender::Male => write!(f, "male"),
            PetGender::Female => write!(f, "female"),
            PetGender::Unknown => write!(f, "unknown"),
        }
    }
}

impl std::str::FromStr for PetGender {
    type Err = anyhow::Error;

    fn from_str(s: &str) -> Result<Self> {
        match s.to_lowercase().as_str() {
            "male" => Ok(PetGender::Male),
            "female" => Ok(PetGender::Female),
            "unknown" => Ok(PetGender::Unknown),
            _ => Err(anyhow::anyhow!("Invalid gender: {}", s)),
        }
    }
}

/// Request structure for creating a new pet
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PetCreateRequest {
    pub name: String,
    pub birth_date: chrono::NaiveDate,
    pub species: PetSpecies,
    pub gender: PetGender,
    pub breed: Option<String>,
    pub color: Option<String>,
    pub weight_kg: Option<f32>,
    pub photo_path: Option<String>,
    pub notes: Option<String>,
    pub display_order: Option<i64>,
}

/// Request structure for updating an existing pet
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct PetUpdateRequest {
    pub name: Option<String>,
    pub birth_date: Option<chrono::NaiveDate>,
    pub species: Option<PetSpecies>,
    pub gender: Option<PetGender>,
    pub breed: Option<String>,
    pub color: Option<String>,
    pub weight_kg: Option<f32>,
    pub photo_path: Option<String>,
    pub notes: Option<String>,
    pub display_order: Option<i64>,
    pub is_archived: Option<bool>,
}

/// Database manager for pet operations
/// Currently uses SQLite but designed for extensibility to other databases
pub struct PetDatabase {
    pool: SqlitePool,
}

impl PetDatabase {
    /// Initialize the database with SQLite
    pub async fn new<P: AsRef<Path>>(db_path: P) -> Result<Self> {
        let db_path = db_path.as_ref();

        // Ensure the parent directory exists
        if let Some(parent) = db_path.parent() {
            if !parent.exists() {
                std::fs::create_dir_all(parent)?;
                log::info!("Created database directory: {}", parent.display());
            }
        }

        let database_url = format!("sqlite:{}", db_path.display());
        log::info!("Connecting to database at: {database_url}");

        let opts = SqliteConnectOptions::from_str(&database_url)?
            .create_if_missing(true)
            .journal_mode(SqliteJournalMode::Wal) // 推荐 WAL
            .synchronous(SqliteSynchronous::Normal)
            .foreign_keys(true);
        let pool = SqlitePool::connect_with(opts).await.map_err(|e| {
            log::error!("Failed to connect to database: {e}");
            e
        })?;

        // Create tables manually for now (skip migrations)
        log::info!("Creating database tables...");
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS pets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(100) NOT NULL,
                birth_date DATE NOT NULL,
                species VARCHAR(20) NOT NULL CHECK (species IN ('cat', 'dog')),
                gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female', 'unknown')),
                breed VARCHAR(100),
                color VARCHAR(50),
                weight_kg REAL,
                photo_path VARCHAR(255),
                notes TEXT,
                display_order INTEGER DEFAULT 0,
                is_archived BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            "#,
        )
        .execute(&pool)
        .await
        .map_err(|e| {
            log::error!("Failed to create pets table: {e}");
            e
        })?;

        // Create indexes
        sqlx::query("CREATE INDEX IF NOT EXISTS idx_pets_display_order ON pets(display_order);")
            .execute(&pool)
            .await?;

        sqlx::query("CREATE INDEX IF NOT EXISTS idx_pets_is_archived ON pets(is_archived);")
            .execute(&pool)
            .await?;

        log::info!("Database initialized and tables created successfully");
        Ok(PetDatabase { pool })
    }

    /// Initialize the database for testing (without migrations)
    pub async fn new_for_test<P: AsRef<Path>>(db_path: P) -> Result<Self> {
        let database_url = format!("sqlite:{}", db_path.as_ref().display());
        let pool = SqlitePool::connect(&database_url).await?;

        // Manually create tables for testing
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS pets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(100) NOT NULL,
                birth_date DATE NOT NULL,
                species VARCHAR(20) NOT NULL CHECK (species IN ('cat', 'dog')),
                gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female', 'unknown')),
                breed VARCHAR(100),
                color VARCHAR(50),
                weight_kg REAL,
                photo_path VARCHAR(255),
                notes TEXT,
                display_order INTEGER DEFAULT 0,
                is_archived BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            "#,
        )
        .execute(&pool)
        .await?;

        // Create indexes for better query performance
        sqlx::query("CREATE INDEX IF NOT EXISTS idx_pets_display_order ON pets(display_order);")
            .execute(&pool)
            .await?;

        sqlx::query("CREATE INDEX IF NOT EXISTS idx_pets_is_archived ON pets(is_archived);")
            .execute(&pool)
            .await?;

        log::info!("Test database initialized successfully");
        Ok(PetDatabase { pool })
    }

    /// Create a new pet
    pub async fn create_pet(&self, pet_data: PetCreateRequest) -> Result<Pet> {
        let now = Utc::now();
        let display_order = match pet_data.display_order {
            Some(order) => order,
            None => self.get_next_display_order().await.unwrap_or(0),
        };

        let result = sqlx::query(
            r#"
            INSERT INTO pets (
                name, birth_date, species, gender, breed, color, 
                weight_kg, photo_path, notes, display_order, 
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&pet_data.name)
        .bind(pet_data.birth_date.format("%Y-%m-%d").to_string())
        .bind(pet_data.species.to_string())
        .bind(pet_data.gender.to_string())
        .bind(&pet_data.breed)
        .bind(&pet_data.color)
        .bind(pet_data.weight_kg)
        .bind(&pet_data.photo_path)
        .bind(&pet_data.notes)
        .bind(display_order)
        .bind(now)
        .bind(now)
        .execute(&self.pool)
        .await?;

        self.get_pet_by_id(result.last_insert_rowid()).await
    }

    /// Get all pets, optionally including archived ones
    pub async fn get_pets(&self, include_archived: bool) -> Result<Vec<Pet>> {
        let sql = if include_archived {
            "SELECT 
                id, name, birth_date, species, gender, breed, color, 
                weight_kg, photo_path, notes, display_order, is_archived, 
                created_at, updated_at 
            FROM pets 
            ORDER BY is_archived ASC, display_order ASC, created_at DESC"
        } else {
            "SELECT 
                id, name, birth_date, species, gender, breed, color, 
                weight_kg, photo_path, notes, display_order, is_archived, 
                created_at, updated_at 
            FROM pets 
            WHERE is_archived = FALSE 
            ORDER BY display_order ASC, created_at DESC"
        };

        let rows = sqlx::query(sql).fetch_all(&self.pool).await?;

        // Convert rows to Pet structs
        let mut pets = Vec::new();
        for row in rows {
            pets.push(self.row_to_pet(&row).await?);
        }

        Ok(pets)
    }

    /// Get a specific pet by ID
    pub async fn get_pet_by_id(&self, id: i64) -> Result<Pet> {
        let row = sqlx::query(
            "SELECT 
                id, name, birth_date, species, gender, breed, color, 
                weight_kg, photo_path, notes, display_order, is_archived, 
                created_at, updated_at 
            FROM pets 
            WHERE id = ?",
        )
        .bind(id)
        .fetch_one(&self.pool)
        .await?;

        self.row_to_pet(&row).await
    }

    /// Update an existing pet
    pub async fn update_pet(&self, id: i64, pet_data: PetUpdateRequest) -> Result<Pet> {
        let now = Utc::now();

        // Build dynamic update query
        let mut updates = Vec::new();
        let mut binds = Vec::new();

        if pet_data.name.is_some() {
            updates.push("name = ?");
            binds.push(pet_data.name.unwrap());
        }
        if let Some(birth_date) = pet_data.birth_date {
            updates.push("birth_date = ?");
            binds.push(birth_date.format("%Y-%m-%d").to_string());
        }
        if let Some(species) = pet_data.species {
            updates.push("species = ?");
            binds.push(species.to_string());
        }
        if let Some(gender) = pet_data.gender {
            updates.push("gender = ?");
            binds.push(gender.to_string());
        }
        if pet_data.breed.is_some() {
            updates.push("breed = ?");
            binds.push(pet_data.breed.unwrap_or_default());
        }
        if pet_data.color.is_some() {
            updates.push("color = ?");
            binds.push(pet_data.color.unwrap_or_default());
        }
        if let Some(weight_kg) = pet_data.weight_kg {
            updates.push("weight_kg = ?");
            binds.push(weight_kg.to_string());
        }
        if pet_data.photo_path.is_some() {
            updates.push("photo_path = ?");
            binds.push(pet_data.photo_path.unwrap_or_default());
        }
        if pet_data.notes.is_some() {
            updates.push("notes = ?");
            binds.push(pet_data.notes.unwrap_or_default());
        }
        if let Some(display_order) = pet_data.display_order {
            updates.push("display_order = ?");
            binds.push(display_order.to_string());
        }
        if let Some(is_archived) = pet_data.is_archived {
            updates.push("is_archived = ?");
            binds.push(is_archived.to_string());
        }

        if !updates.is_empty() {
            let query = format!(
                "UPDATE pets SET updated_at = ?, {} WHERE id = ?",
                updates.join(", ")
            );

            let mut sql_query = sqlx::query(&query);
            sql_query = sql_query.bind(now);
            for bind in binds {
                sql_query = sql_query.bind(bind);
            }
            sql_query = sql_query.bind(id);
            sql_query.execute(&self.pool).await?;
        }

        self.get_pet_by_id(id).await
    }

    /// Delete a pet (soft delete by archiving)
    pub async fn delete_pet(&self, id: i64) -> Result<()> {
        let now = Utc::now();
        let result = sqlx::query("UPDATE pets SET is_archived = TRUE, updated_at = ? WHERE id = ?")
            .bind(now)
            .bind(id)
            .execute(&self.pool)
            .await?;

        if result.rows_affected() == 0 {
            return Err(anyhow::anyhow!("Pet with id {} not found", id));
        }

        Ok(())
    }

    /// Reorder pets by updating their display_order
    pub async fn reorder_pets(&self, pet_ids: Vec<i64>) -> Result<()> {
        let now = Utc::now();
        let mut tx = self.pool.begin().await?;

        for (index, pet_id) in pet_ids.iter().enumerate() {
            sqlx::query("UPDATE pets SET display_order = ?, updated_at = ? WHERE id = ?")
                .bind(index as i64)
                .bind(now)
                .bind(pet_id)
                .execute(&mut *tx)
                .await?;
        }

        tx.commit().await?;
        Ok(())
    }

    /// Helper method to convert database row to Pet struct
    async fn row_to_pet(&self, row: &sqlx::sqlite::SqliteRow) -> Result<Pet> {
        let birth_date_str: String = row.try_get("birth_date")?;
        let birth_date = chrono::NaiveDate::parse_from_str(&birth_date_str, "%Y-%m-%d")
            .map_err(|_| anyhow::anyhow!("Invalid birth_date format"))?;

        let species_str: String = row.try_get("species")?;
        let species = species_str.parse::<PetSpecies>()?;

        let gender_str: String = row.try_get("gender")?;
        let gender = gender_str.parse::<PetGender>()?;

        let created_at: DateTime<Utc> = row.try_get("created_at")?;
        let updated_at: DateTime<Utc> = row.try_get("updated_at")?;

        Ok(Pet {
            id: row.try_get("id")?,
            name: row.try_get("name")?,
            birth_date,
            species,
            gender,
            breed: row.try_get("breed")?,
            color: row.try_get("color")?,
            weight_kg: row.try_get("weight_kg")?,
            photo_path: row.try_get("photo_path")?,
            notes: row.try_get("notes")?,
            display_order: row.try_get("display_order")?,
            is_archived: row.try_get("is_archived")?,
            created_at,
            updated_at,
        })
    }

    /// Get the next available display order
    async fn get_next_display_order(&self) -> Result<i64> {
        let row =
            sqlx::query("SELECT COALESCE(MAX(display_order), -1) + 1 as next_order FROM pets")
                .fetch_one(&self.pool)
                .await?;

        let next_order: i64 = row.try_get("next_order")?;
        Ok(next_order)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::NaiveDate;

    async fn setup_test_db() -> PetDatabase {
        PetDatabase::new(":memory:")
            .await
            .expect("Failed to create test database")
    }

    #[tokio::test]
    async fn test_create_and_get_pet() {
        let db = setup_test_db().await;

        let pet_data = PetCreateRequest {
            name: "Fluffy".to_string(),
            birth_date: NaiveDate::from_ymd_opt(2020, 1, 1).unwrap(),
            species: PetSpecies::Cat,
            gender: PetGender::Female,
            breed: Some("Persian".to_string()),
            color: Some("White".to_string()),
            weight_kg: Some(4.5),
            photo_path: None,
            notes: Some("Very fluffy cat".to_string()),
            display_order: None,
        };

        let created_pet = db.create_pet(pet_data).await.expect("Failed to create pet");
        assert_eq!(created_pet.name, "Fluffy");
        assert_eq!(created_pet.species, PetSpecies::Cat);
        assert_eq!(created_pet.gender, PetGender::Female);
        assert_eq!(created_pet.weight_kg, Some(4.5));

        let retrieved_pet = db
            .get_pet_by_id(created_pet.id)
            .await
            .expect("Failed to get pet");
        assert_eq!(retrieved_pet.name, created_pet.name);
        assert_eq!(retrieved_pet.id, created_pet.id);
    }

    #[tokio::test]
    async fn test_get_all_pets() {
        let db = setup_test_db().await;

        // Create multiple pets
        let pet1_data = PetCreateRequest {
            name: "Dog1".to_string(),
            birth_date: NaiveDate::from_ymd_opt(2021, 1, 1).unwrap(),
            species: PetSpecies::Dog,
            gender: PetGender::Male,
            breed: None,
            color: None,
            weight_kg: None,
            photo_path: None,
            notes: None,
            display_order: Some(1),
        };

        let pet2_data = PetCreateRequest {
            name: "Cat1".to_string(),
            birth_date: NaiveDate::from_ymd_opt(2022, 1, 1).unwrap(),
            species: PetSpecies::Cat,
            gender: PetGender::Female,
            breed: None,
            color: None,
            weight_kg: None,
            photo_path: None,
            notes: None,
            display_order: Some(0),
        };

        db.create_pet(pet1_data)
            .await
            .expect("Failed to create pet1");
        db.create_pet(pet2_data)
            .await
            .expect("Failed to create pet2");

        let pets = db.get_pets(false).await.expect("Failed to get pets");
        assert_eq!(pets.len(), 2);

        // Should be ordered by display_order
        assert_eq!(pets[0].name, "Cat1");
        assert_eq!(pets[1].name, "Dog1");
    }

    #[tokio::test]
    async fn test_delete_pet() {
        let db = setup_test_db().await;

        let pet_data = PetCreateRequest {
            name: "To Delete".to_string(),
            birth_date: NaiveDate::from_ymd_opt(2020, 1, 1).unwrap(),
            species: PetSpecies::Cat,
            gender: PetGender::Unknown,
            breed: None,
            color: None,
            weight_kg: None,
            photo_path: None,
            notes: None,
            display_order: None,
        };

        let created_pet = db.create_pet(pet_data).await.expect("Failed to create pet");

        db.delete_pet(created_pet.id)
            .await
            .expect("Failed to delete pet");

        // Pet should still exist but be archived
        let retrieved_pet = db
            .get_pet_by_id(created_pet.id)
            .await
            .expect("Failed to get pet");
        assert!(retrieved_pet.is_archived);

        // Should not appear in non-archived list
        let pets = db.get_pets(false).await.expect("Failed to get pets");
        assert_eq!(pets.len(), 0);

        // Should appear in archived list
        let all_pets = db.get_pets(true).await.expect("Failed to get all pets");
        assert_eq!(all_pets.len(), 1);
        assert!(all_pets[0].is_archived);
    }

    #[tokio::test]
    async fn test_reorder_pets() {
        let db = setup_test_db().await;

        // Create 3 pets
        let pet1 = db
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
            .expect("Failed to create pet1");

        let pet2 = db
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
            .expect("Failed to create pet2");

        let pet3 = db
            .create_pet(PetCreateRequest {
                name: "Pet3".to_string(),
                birth_date: NaiveDate::from_ymd_opt(2020, 1, 1).unwrap(),
                species: PetSpecies::Cat,
                gender: PetGender::Unknown,
                breed: None,
                color: None,
                weight_kg: None,
                photo_path: None,
                notes: None,
                display_order: None,
            })
            .await
            .expect("Failed to create pet3");

        // Reorder: pet3, pet1, pet2
        db.reorder_pets(vec![pet3.id, pet1.id, pet2.id])
            .await
            .expect("Failed to reorder pets");

        let pets = db.get_pets(false).await.expect("Failed to get pets");
        assert_eq!(pets.len(), 3);
        assert_eq!(pets[0].name, "Pet3");
        assert_eq!(pets[1].name, "Pet1");
        assert_eq!(pets[2].name, "Pet2");
    }
}
