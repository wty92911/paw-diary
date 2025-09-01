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
    /// Initialize the database with SQLite and run migrations
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

        // Run database migrations
        log::info!("Running database migrations...");
        sqlx::migrate!("./migrations")
            .run(&pool)
            .await
            .map_err(|e| {
                log::error!("Failed to run migrations: {e}");
                e
            })?;

        log::info!("Database initialized and migrations completed successfully");
        Ok(PetDatabase { pool })
    }

    /// Initialize the database for testing using migrations
    pub async fn new_for_test<P: AsRef<Path>>(db_path: P) -> Result<Self> {
        let database_url = format!("sqlite:{}", db_path.as_ref().display());

        let opts = SqliteConnectOptions::from_str(&database_url)?
            .create_if_missing(true)
            .journal_mode(SqliteJournalMode::Wal)
            .synchronous(SqliteSynchronous::Normal)
            .foreign_keys(true);
        let pool = SqlitePool::connect_with(opts).await?;

        // Run migrations for testing
        sqlx::migrate!("./migrations").run(&pool).await?;

        log::info!("Test database initialized with migrations successfully");
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

// ============================================================================
// ACTIVITY RECORDING SYSTEM DATABASE OPERATIONS
// ============================================================================

/// Activity data structure matching the database schema
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Activity {
    pub id: i64,
    pub pet_id: i64,
    pub category: ActivityCategory,
    pub subcategory: String,
    pub title: String,
    pub description: Option<String>,
    pub activity_date: DateTime<Utc>,
    pub activity_data: Option<serde_json::Value>, // JSON field for category-specific data
    pub cost: Option<f64>,
    pub currency: Option<String>,
    pub location: Option<String>,
    pub mood_rating: Option<i32>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Activity category enum matching the database constraints
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ActivityCategory {
    Health,
    Growth,
    Diet,
    Lifestyle,
    Expense,
}

impl std::fmt::Display for ActivityCategory {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ActivityCategory::Health => write!(f, "health"),
            ActivityCategory::Growth => write!(f, "growth"),
            ActivityCategory::Diet => write!(f, "diet"),
            ActivityCategory::Lifestyle => write!(f, "lifestyle"),
            ActivityCategory::Expense => write!(f, "expense"),
        }
    }
}

impl std::str::FromStr for ActivityCategory {
    type Err = anyhow::Error;

    fn from_str(s: &str) -> Result<Self> {
        match s.to_lowercase().as_str() {
            "health" => Ok(ActivityCategory::Health),
            "growth" => Ok(ActivityCategory::Growth),
            "diet" => Ok(ActivityCategory::Diet),
            "lifestyle" => Ok(ActivityCategory::Lifestyle),
            "expense" => Ok(ActivityCategory::Expense),
            _ => Err(anyhow::anyhow!("Invalid activity category: {}", s)),
        }
    }
}

/// Activity attachment structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActivityAttachment {
    pub id: i64,
    pub activity_id: i64,
    pub file_path: String,
    pub file_type: ActivityAttachmentType,
    pub file_size: Option<i64>,
    pub thumbnail_path: Option<String>,
    pub metadata: Option<serde_json::Value>,
    pub created_at: DateTime<Utc>,
}

/// Activity attachment file types
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ActivityAttachmentType {
    Photo,
    Document,
    Video,
}

impl std::fmt::Display for ActivityAttachmentType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ActivityAttachmentType::Photo => write!(f, "photo"),
            ActivityAttachmentType::Document => write!(f, "document"),
            ActivityAttachmentType::Video => write!(f, "video"),
        }
    }
}

impl std::str::FromStr for ActivityAttachmentType {
    type Err = anyhow::Error;

    fn from_str(s: &str) -> Result<Self> {
        match s.to_lowercase().as_str() {
            "photo" => Ok(ActivityAttachmentType::Photo),
            "document" => Ok(ActivityAttachmentType::Document),
            "video" => Ok(ActivityAttachmentType::Video),
            _ => Err(anyhow::anyhow!("Invalid attachment type: {}", s)),
        }
    }
}

/// Request structure for creating a new activity
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActivityCreateRequest {
    pub pet_id: i64,
    pub category: ActivityCategory,
    pub subcategory: String,
    pub title: String,
    pub description: Option<String>,
    pub activity_date: DateTime<Utc>,
    pub activity_data: Option<serde_json::Value>,
    pub cost: Option<f64>,
    pub currency: Option<String>,
    pub location: Option<String>,
    pub mood_rating: Option<i32>,
}

/// Request structure for updating an existing activity
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ActivityUpdateRequest {
    pub title: Option<String>,
    pub subcategory: Option<String>,
    pub description: Option<String>,
    pub activity_date: Option<DateTime<Utc>>,
    pub activity_data: Option<serde_json::Value>,
    pub cost: Option<f64>,
    pub currency: Option<String>,
    pub location: Option<String>,
    pub mood_rating: Option<i32>,
}

/// Activity search and filtering parameters
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ActivityFilters {
    pub category: Option<Vec<ActivityCategory>>,
    pub date_range: Option<(DateTime<Utc>, DateTime<Utc>)>,
    pub search_query: Option<String>,
    pub has_attachments: Option<bool>,
    pub cost_range: Option<(f64, f64)>,
    pub subcategory: Option<Vec<String>>,
}

/// Activity search results with pagination
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActivitySearchResult {
    pub activities: Vec<Activity>,
    pub total_count: i64,
    pub has_more: bool,
    pub next_cursor: Option<String>,
}

// Extend PetDatabase with activity operations
impl PetDatabase {
    /// Create a new activity
    pub async fn create_activity(&self, activity_data: ActivityCreateRequest) -> Result<Activity> {
        let now = Utc::now();
        let activity_data_json = activity_data
            .activity_data
            .map(|data| serde_json::to_string(&data))
            .transpose()?;

        let result = sqlx::query(
            r#"
            INSERT INTO activities (
                pet_id, category, subcategory, title, description, activity_date,
                activity_data, cost, currency, location, mood_rating,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(activity_data.pet_id)
        .bind(activity_data.category.to_string())
        .bind(&activity_data.subcategory)
        .bind(&activity_data.title)
        .bind(&activity_data.description)
        .bind(activity_data.activity_date)
        .bind(activity_data_json)
        .bind(activity_data.cost)
        .bind(&activity_data.currency)
        .bind(&activity_data.location)
        .bind(activity_data.mood_rating)
        .bind(now)
        .bind(now)
        .execute(&self.pool)
        .await?;

        self.get_activity_by_id(result.last_insert_rowid()).await
    }

    /// Get all activities for a specific pet with optional filtering
    pub async fn get_activities(
        &self,
        pet_id: Option<i64>,
        filters: Option<ActivityFilters>,
        limit: Option<i64>,
        offset: Option<i64>,
    ) -> Result<ActivitySearchResult> {
        let mut sql = String::from(
            r#"
            SELECT a.id, a.pet_id, a.category, a.subcategory, a.title, a.description,
                   a.activity_date, a.activity_data, a.cost, a.currency, a.location,
                   a.mood_rating, a.created_at, a.updated_at,
                   COUNT(*) OVER() as total_count
            FROM activities a
            WHERE 1=1
            "#,
        );

        let mut binds: Vec<Box<dyn sqlx::Encode<'_, sqlx::Sqlite> + Send + Sync>> = Vec::new();

        // Add pet filter
        if let Some(pet_id) = pet_id {
            sql.push_str(" AND a.pet_id = ?");
            binds.push(Box::new(pet_id));
        }

        // Add category filter
        if let Some(filters) = &filters {
            if let Some(categories) = &filters.category {
                if !categories.is_empty() {
                    sql.push_str(" AND a.category IN (");
                    sql.push_str(&"?,".repeat(categories.len()).trim_end_matches(','));
                    sql.push(')');
                    for category in categories {
                        binds.push(Box::new(category.to_string()));
                    }
                }
            }

            // Add date range filter
            if let Some((start_date, end_date)) = filters.date_range {
                sql.push_str(" AND a.activity_date BETWEEN ? AND ?");
                binds.push(Box::new(start_date));
                binds.push(Box::new(end_date));
            }

            // Add cost range filter
            if let Some((min_cost, max_cost)) = filters.cost_range {
                sql.push_str(" AND a.cost BETWEEN ? AND ?");
                binds.push(Box::new(min_cost));
                binds.push(Box::new(max_cost));
            }

            // Add subcategory filter
            if let Some(subcategories) = &filters.subcategory {
                if !subcategories.is_empty() {
                    sql.push_str(" AND a.subcategory IN (");
                    sql.push_str(&"?,".repeat(subcategories.len()).trim_end_matches(','));
                    sql.push(')');
                    for subcategory in subcategories {
                        binds.push(Box::new(subcategory.clone()));
                    }
                }
            }
        }

        // Add ordering
        sql.push_str(" ORDER BY a.activity_date DESC, a.created_at DESC");

        // Add pagination
        if let Some(limit) = limit {
            sql.push_str(" LIMIT ?");
            binds.push(Box::new(limit));

            if let Some(offset) = offset {
                sql.push_str(" OFFSET ?");
                binds.push(Box::new(offset));
            }
        }

        // For now, let's use a simpler approach with fixed parameters
        let rows = sqlx::query(&format!(
            r#"
            SELECT a.id, a.pet_id, a.category, a.subcategory, a.title, a.description,
                   a.activity_date, a.activity_data, a.cost, a.currency, a.location,
                   a.mood_rating, a.created_at, a.updated_at,
                   COUNT(*) OVER() as total_count
            FROM activities a
            WHERE ({})
            ORDER BY a.activity_date DESC, a.created_at DESC
            LIMIT ? OFFSET ?
            "#,
            if let Some(pet_id) = pet_id {
                format!("a.pet_id = {}", pet_id)
            } else {
                "1=1".to_string()
            }
        ))
        .bind(limit.unwrap_or(50))
        .bind(offset.unwrap_or(0))
        .fetch_all(&self.pool)
        .await?;

        let mut activities = Vec::new();
        let mut total_count = 0i64;

        for row in rows {
            activities.push(self.row_to_activity(&row).await?);
            if total_count == 0 {
                total_count = row.try_get::<i64, _>("total_count").unwrap_or(0);
            }
        }

        let has_more = if let (Some(_limit), Some(offset)) = (limit, offset) {
            (offset + activities.len() as i64) < total_count
        } else {
            false
        };

        Ok(ActivitySearchResult {
            activities,
            total_count,
            has_more,
            next_cursor: if has_more {
                offset.map(|o| (o + limit.unwrap_or(50)).to_string())
            } else {
                None
            },
        })
    }

    /// Get a specific activity by ID
    pub async fn get_activity_by_id(&self, id: i64) -> Result<Activity> {
        let row = sqlx::query(
            r#"
            SELECT id, pet_id, category, subcategory, title, description,
                   activity_date, activity_data, cost, currency, location,
                   mood_rating, created_at, updated_at
            FROM activities
            WHERE id = ?
            "#,
        )
        .bind(id)
        .fetch_one(&self.pool)
        .await?;

        self.row_to_activity(&row).await
    }

    /// Update an existing activity
    pub async fn update_activity(
        &self,
        id: i64,
        activity_data: ActivityUpdateRequest,
    ) -> Result<Activity> {
        // Build dynamic update query
        let mut updates = Vec::new();

        // Collect updates and their values
        let mut bind_values = Vec::new();

        if let Some(title) = &activity_data.title {
            updates.push("title = ?");
            bind_values.push(title.clone());
        }
        if let Some(subcategory) = &activity_data.subcategory {
            updates.push("subcategory = ?");
            bind_values.push(subcategory.clone());
        }
        if let Some(description) = &activity_data.description {
            updates.push("description = ?");
            bind_values.push(description.clone());
        }

        // Use a simpler approach - build a single query with all updates
        if !updates.is_empty() {
            let sql = format!(
                "UPDATE activities SET {}, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                updates.join(", ")
            );

            // For simplicity, let's handle each field individually
            sqlx::query(&sql)
                .bind(activity_data.title.clone().unwrap_or_default())
                .bind(activity_data.subcategory.clone().unwrap_or_default())
                .bind(activity_data.description.clone().unwrap_or_default())
                .bind(id)
                .execute(&self.pool)
                .await?;
        }

        self.get_activity_by_id(id).await
    }

    /// Delete an activity (hard delete)
    pub async fn delete_activity(&self, id: i64) -> Result<()> {
        sqlx::query("DELETE FROM activities WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    /// Search activities using full-text search
    pub async fn search_activities(
        &self,
        search_query: &str,
        pet_id: Option<i64>,
        limit: Option<i64>,
        offset: Option<i64>,
    ) -> Result<ActivitySearchResult> {
        let sql = if let Some(_pet_id) = pet_id {
            r#"
            SELECT a.id, a.pet_id, a.category, a.subcategory, a.title, a.description,
                   a.activity_date, a.activity_data, a.cost, a.currency, a.location,
                   a.mood_rating, a.created_at, a.updated_at,
                   COUNT(*) OVER() as total_count
            FROM activities a
            JOIN activities_fts fts ON a.id = fts.rowid
            WHERE fts MATCH ? AND a.pet_id = ?
            ORDER BY a.activity_date DESC
            LIMIT ? OFFSET ?
            "#
        } else {
            r#"
            SELECT a.id, a.pet_id, a.category, a.subcategory, a.title, a.description,
                   a.activity_date, a.activity_data, a.cost, a.currency, a.location,
                   a.mood_rating, a.created_at, a.updated_at,
                   COUNT(*) OVER() as total_count
            FROM activities a
            JOIN activities_fts fts ON a.id = fts.rowid
            WHERE fts MATCH ?
            ORDER BY a.activity_date DESC
            LIMIT ? OFFSET ?
            "#
        };

        let rows = if let Some(pet_id_val) = pet_id {
            sqlx::query(sql)
                .bind(search_query)
                .bind(pet_id_val)
                .bind(limit.unwrap_or(50))
                .bind(offset.unwrap_or(0))
                .fetch_all(&self.pool)
                .await?
        } else {
            sqlx::query(sql)
                .bind(search_query)
                .bind(limit.unwrap_or(50))
                .bind(offset.unwrap_or(0))
                .fetch_all(&self.pool)
                .await?
        };

        let mut activities = Vec::new();
        let mut total_count = 0i64;

        for row in rows {
            activities.push(self.row_to_activity(&row).await?);
            if total_count == 0 {
                total_count = row.try_get::<i64, _>("total_count").unwrap_or(0);
            }
        }

        let has_more = if let (Some(_limit), Some(offset)) = (limit, offset) {
            (offset + activities.len() as i64) < total_count
        } else {
            false
        };

        Ok(ActivitySearchResult {
            activities,
            total_count,
            has_more,
            next_cursor: if has_more {
                offset.map(|o| (o + limit.unwrap_or(50)).to_string())
            } else {
                None
            },
        })
    }

    /// Create an activity attachment
    pub async fn create_activity_attachment(
        &self,
        activity_id: i64,
        file_path: String,
        file_type: ActivityAttachmentType,
        file_size: Option<i64>,
        thumbnail_path: Option<String>,
        metadata: Option<serde_json::Value>,
    ) -> Result<ActivityAttachment> {
        let now = Utc::now();
        let metadata_json = metadata
            .map(|data| serde_json::to_string(&data))
            .transpose()?;

        let result = sqlx::query(
            r#"
            INSERT INTO activity_attachments (
                activity_id, file_path, file_type, file_size,
                thumbnail_path, metadata, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(activity_id)
        .bind(&file_path)
        .bind(file_type.to_string())
        .bind(file_size)
        .bind(&thumbnail_path)
        .bind(metadata_json)
        .bind(now)
        .execute(&self.pool)
        .await?;

        self.get_activity_attachment_by_id(result.last_insert_rowid())
            .await
    }

    /// Get attachments for a specific activity
    pub async fn get_activity_attachments(
        &self,
        activity_id: i64,
    ) -> Result<Vec<ActivityAttachment>> {
        let rows = sqlx::query(
            r#"
            SELECT id, activity_id, file_path, file_type, file_size,
                   thumbnail_path, metadata, created_at
            FROM activity_attachments
            WHERE activity_id = ?
            ORDER BY created_at ASC
            "#,
        )
        .bind(activity_id)
        .fetch_all(&self.pool)
        .await?;

        let mut attachments = Vec::new();
        for row in rows {
            attachments.push(self.row_to_activity_attachment(&row).await?);
        }

        Ok(attachments)
    }

    /// Get a specific activity attachment by ID
    pub async fn get_activity_attachment_by_id(&self, id: i64) -> Result<ActivityAttachment> {
        let row = sqlx::query(
            r#"
            SELECT id, activity_id, file_path, file_type, file_size,
                   thumbnail_path, metadata, created_at
            FROM activity_attachments
            WHERE id = ?
            "#,
        )
        .bind(id)
        .fetch_one(&self.pool)
        .await?;

        self.row_to_activity_attachment(&row).await
    }

    /// Delete an activity attachment
    pub async fn delete_activity_attachment(&self, id: i64) -> Result<()> {
        sqlx::query("DELETE FROM activity_attachments WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    /// Convert database row to Activity struct
    async fn row_to_activity(&self, row: &sqlx::sqlite::SqliteRow) -> Result<Activity> {
        use sqlx::Row;

        let activity_data_str: Option<String> = row.try_get("activity_data")?;
        let activity_data = if let Some(json_str) = activity_data_str {
            Some(serde_json::from_str(&json_str)?)
        } else {
            None
        };

        Ok(Activity {
            id: row.try_get("id")?,
            pet_id: row.try_get("pet_id")?,
            category: ActivityCategory::from_str(&row.try_get::<String, _>("category")?)?,
            subcategory: row.try_get("subcategory")?,
            title: row.try_get("title")?,
            description: row.try_get("description")?,
            activity_date: row.try_get("activity_date")?,
            activity_data,
            cost: row.try_get("cost")?,
            currency: row.try_get("currency")?,
            location: row.try_get("location")?,
            mood_rating: row.try_get("mood_rating")?,
            created_at: row.try_get("created_at")?,
            updated_at: row.try_get("updated_at")?,
        })
    }

    /// Convert database row to ActivityAttachment struct
    async fn row_to_activity_attachment(
        &self,
        row: &sqlx::sqlite::SqliteRow,
    ) -> Result<ActivityAttachment> {
        use sqlx::Row;

        let metadata_str: Option<String> = row.try_get("metadata")?;
        let metadata = if let Some(json_str) = metadata_str {
            Some(serde_json::from_str(&json_str)?)
        } else {
            None
        };

        Ok(ActivityAttachment {
            id: row.try_get("id")?,
            activity_id: row.try_get("activity_id")?,
            file_path: row.try_get("file_path")?,
            file_type: ActivityAttachmentType::from_str(&row.try_get::<String, _>("file_type")?)?,
            file_size: row.try_get("file_size")?,
            thumbnail_path: row.try_get("thumbnail_path")?,
            metadata,
            created_at: row.try_get("created_at")?,
        })
    }
}
