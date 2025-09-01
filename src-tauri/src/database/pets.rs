use super::models::*;
use anyhow::Result;
use chrono::{DateTime, Utc};
use sqlx::Row;

impl super::PetDatabase {
    /// Create a new pet
    pub async fn create_pet(&self, pet_data: CreatePetRequest) -> Result<Pet> {
        let now = Utc::now();
        let display_order = self.get_next_display_order().await?;

        let result = sqlx::query(
            r#"
            INSERT INTO pets (name, birth_date, species, gender, breed, color, weight_kg, photo_path, notes, display_order, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#
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
        let query = if include_archived {
            "SELECT * FROM pets ORDER BY display_order ASC, created_at DESC"
        } else {
            "SELECT * FROM pets WHERE is_archived = 0 ORDER BY display_order ASC, created_at DESC"
        };

        let rows = sqlx::query(query).fetch_all(&self.pool).await?;

        let mut pets = Vec::new();
        for row in rows {
            pets.push(self.row_to_pet(&row).await?);
        }

        Ok(pets)
    }

    /// Get a pet by ID
    pub async fn get_pet_by_id(&self, id: i64) -> Result<Pet> {
        let row = sqlx::query("SELECT * FROM pets WHERE id = ?")
            .bind(id)
            .fetch_one(&self.pool)
            .await?;

        self.row_to_pet(&row).await
    }

    /// Update a pet
    pub async fn update_pet(&self, id: i64, pet_data: UpdatePetRequest) -> Result<Pet> {
        let now = Utc::now();

        // Build dynamic update query
        let mut updates = Vec::new();
        let mut params = Vec::new();

        if let Some(name) = &pet_data.name {
            updates.push("name = ?");
            params.push(name.clone());
        }
        if let Some(birth_date) = pet_data.birth_date {
            updates.push("birth_date = ?");
            params.push(birth_date.format("%Y-%m-%d").to_string());
        }
        if let Some(species) = &pet_data.species {
            updates.push("species = ?");
            params.push(species.to_string());
        }
        if let Some(gender) = &pet_data.gender {
            updates.push("gender = ?");
            params.push(gender.to_string());
        }
        if pet_data.breed.is_some() {
            updates.push("breed = ?");
            params.push(pet_data.breed.clone().unwrap_or_default());
        }
        if pet_data.color.is_some() {
            updates.push("color = ?");
            params.push(pet_data.color.clone().unwrap_or_default());
        }
        if let Some(weight_kg) = pet_data.weight_kg {
            updates.push("weight_kg = ?");
            params.push(weight_kg.to_string());
        }
        if pet_data.photo_path.is_some() {
            updates.push("photo_path = ?");
            params.push(pet_data.photo_path.clone().unwrap_or_default());
        }
        if pet_data.notes.is_some() {
            updates.push("notes = ?");
            params.push(pet_data.notes.clone().unwrap_or_default());
        }

        if !updates.is_empty() {
            // Build proper dynamic query with all field bindings
            let query_sql = format!(
                "UPDATE pets SET {}, updated_at = ? WHERE id = ?",
                updates.join(", ")
            );

            let mut query = sqlx::query(&query_sql);

            // Add bindings in the same order as updates
            if let Some(name) = pet_data.name {
                query = query.bind(name);
            }
            if let Some(birth_date) = pet_data.birth_date {
                query = query.bind(birth_date.format("%Y-%m-%d").to_string());
            }
            if let Some(species) = pet_data.species {
                query = query.bind(species.to_string());
            }
            if let Some(gender) = pet_data.gender {
                query = query.bind(gender.to_string());
            }
            if pet_data.breed.is_some() {
                query = query.bind(pet_data.breed.unwrap_or_default());
            }
            if pet_data.color.is_some() {
                query = query.bind(pet_data.color.unwrap_or_default());
            }
            if let Some(weight_kg) = pet_data.weight_kg {
                query = query.bind(weight_kg);
            }
            if pet_data.photo_path.is_some() {
                query = query.bind(pet_data.photo_path.unwrap_or_default());
            }
            if pet_data.notes.is_some() {
                query = query.bind(pet_data.notes.unwrap_or_default());
            }

            query = query.bind(now).bind(id);
            query.execute(&self.pool).await?;
        }

        self.get_pet_by_id(id).await
    }

    /// Delete a pet (soft delete by archiving)
    pub async fn delete_pet(&self, id: i64) -> Result<()> {
        let now = Utc::now();
        sqlx::query("UPDATE pets SET is_archived = 1, updated_at = ? WHERE id = ?")
            .bind(now)
            .bind(id)
            .execute(&self.pool)
            .await?;
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

    /// Helper method to get the next display order
    async fn get_next_display_order(&self) -> Result<i64> {
        let row =
            sqlx::query("SELECT COALESCE(MAX(display_order), -1) + 1 as next_order FROM pets")
                .fetch_one(&self.pool)
                .await?;

        Ok(row.try_get("next_order").unwrap_or(0))
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
}
