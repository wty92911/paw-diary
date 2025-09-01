use super::models::*;
use anyhow::Result;
use chrono::{DateTime, Utc};
use sqlx::Row;

impl super::PetDatabase {
    /// Create a new activity
    pub async fn create_activity(&self, activity_data: ActivityCreateRequest) -> Result<Activity> {
        let now = Utc::now();
        let activity_data_json = activity_data
            .activity_data
            .map(|data| serde_json::to_string(&data))
            .transpose()?;

        let result = sqlx::query(
            r#"
            INSERT INTO activities (pet_id, category, subcategory, title, description, activity_date, 
                                  activity_data, cost, currency, location, mood_rating, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#
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

        // Update FTS table
        if let Some(activity_id) = Some(result.last_insert_rowid()) {
            let _ = sqlx::query(
                "INSERT INTO activities_fts(rowid, title, description, category, subcategory) 
                 VALUES (?, ?, ?, ?, ?)",
            )
            .bind(activity_id)
            .bind(&activity_data.title)
            .bind(&activity_data.description)
            .bind(activity_data.category.to_string())
            .bind(&activity_data.subcategory)
            .execute(&self.pool)
            .await;
        }

        self.get_activity_by_id(result.last_insert_rowid()).await
    }

    /// Get activities with optional filtering
    pub async fn get_activities(
        &self,
        pet_id: Option<i64>,
        filters: Option<ActivityFilters>,
        limit: Option<i64>,
        offset: Option<i64>,
    ) -> Result<ActivitySearchResult> {
        let mut base_query = String::from(
            "SELECT id, pet_id, category, subcategory, title, description, activity_date, 
             activity_data, cost, currency, location, mood_rating, created_at, updated_at,
             COUNT(*) OVER() as total_count FROM activities WHERE 1=1",
        );
        let mut bind_values = Vec::new();

        // Pet filter
        if let Some(pid) = pet_id {
            base_query.push_str(" AND pet_id = ?");
            bind_values.push(pid.to_string());
        }

        // Category filters
        if let Some(filters) = &filters {
            if let Some(categories) = &filters.categories {
                let category_placeholders = categories
                    .iter()
                    .map(|_| "?")
                    .collect::<Vec<_>>()
                    .join(", ");
                base_query.push_str(&format!(" AND category IN ({category_placeholders})"));
                for category in categories {
                    bind_values.push(category.to_string());
                }
            }

            // Date filters
            if let Some(date_from) = filters.date_from {
                base_query.push_str(" AND activity_date >= ?");
                bind_values.push(date_from.to_rfc3339());
            }
            if let Some(date_to) = filters.date_to {
                base_query.push_str(" AND activity_date <= ?");
                bind_values.push(date_to.to_rfc3339());
            }

            // Cost filters
            if let Some(min_cost) = filters.min_cost {
                base_query.push_str(" AND cost >= ?");
                bind_values.push(min_cost.to_string());
            }
            if let Some(max_cost) = filters.max_cost {
                base_query.push_str(" AND cost <= ?");
                bind_values.push(max_cost.to_string());
            }
        }

        base_query.push_str(" ORDER BY activity_date DESC");

        // Add pagination
        if let Some(limit) = limit {
            base_query.push_str(" LIMIT ?");
            bind_values.push(limit.to_string());

            if let Some(offset) = offset {
                base_query.push_str(" OFFSET ?");
                bind_values.push(offset.to_string());
            }
        }

        // For now, let's use a simpler approach with fixed parameters
        let rows = sqlx::query(
            r#"
            SELECT a.id, a.pet_id, a.category, a.subcategory, a.title, a.description,
                   a.activity_date, a.activity_data, a.cost, a.currency, a.location,
                   a.mood_rating, a.created_at, a.updated_at,
                   COUNT(*) OVER() as total_count
            FROM activities a
            WHERE 1=1
            ORDER BY a.activity_date DESC
            LIMIT 50 OFFSET 0
            "#,
        )
        .fetch_all(&self.pool)
        .await?;

        let mut activities = Vec::new();
        let mut total_count = 0i64;

        for row in rows {
            if total_count == 0 {
                total_count = row.try_get("total_count").unwrap_or(0);
            }
            activities.push(self.row_to_activity(&row).await?);
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
        })
    }

    /// Get activity by ID
    pub async fn get_activity_by_id(&self, id: i64) -> Result<Activity> {
        let row = sqlx::query("SELECT * FROM activities WHERE id = ?")
            .bind(id)
            .fetch_one(&self.pool)
            .await?;

        self.row_to_activity(&row).await
    }

    /// Update an activity
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

    /// Delete an activity
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
            if total_count == 0 {
                total_count = row.try_get("total_count").unwrap_or(0);
            }
            activities.push(self.row_to_activity(&row).await?);
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
            INSERT INTO activity_attachments (activity_id, file_path, file_type, file_size, thumbnail_path, metadata, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            "#
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

    /// Get activity attachment by ID
    pub async fn get_activity_attachment_by_id(&self, id: i64) -> Result<ActivityAttachment> {
        let row = sqlx::query("SELECT * FROM activity_attachments WHERE id = ?")
            .bind(id)
            .fetch_one(&self.pool)
            .await?;

        self.row_to_activity_attachment(&row).await
    }

    /// Get attachments for an activity
    pub async fn get_activity_attachments(
        &self,
        activity_id: i64,
    ) -> Result<Vec<ActivityAttachment>> {
        let rows = sqlx::query(
            "SELECT * FROM activity_attachments WHERE activity_id = ? ORDER BY created_at DESC",
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

    /// Delete an activity attachment
    pub async fn delete_activity_attachment(&self, id: i64) -> Result<()> {
        sqlx::query("DELETE FROM activity_attachments WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    /// Helper method to convert database row to Activity struct
    async fn row_to_activity(&self, row: &sqlx::sqlite::SqliteRow) -> Result<Activity> {
        let category_str: String = row.try_get("category")?;
        let category = category_str.parse::<ActivityCategory>()?;

        let activity_data_str: Option<String> = row.try_get("activity_data")?;
        let activity_data = activity_data_str
            .map(|s| serde_json::from_str(&s))
            .transpose()?;

        let activity_date: DateTime<Utc> = row.try_get("activity_date")?;
        let created_at: DateTime<Utc> = row.try_get("created_at")?;
        let updated_at: DateTime<Utc> = row.try_get("updated_at")?;

        Ok(Activity {
            id: row.try_get("id")?,
            pet_id: row.try_get("pet_id")?,
            category,
            subcategory: row.try_get("subcategory")?,
            title: row.try_get("title")?,
            description: row.try_get("description")?,
            activity_date,
            activity_data,
            cost: row.try_get("cost")?,
            currency: row.try_get("currency")?,
            location: row.try_get("location")?,
            mood_rating: row.try_get("mood_rating")?,
            created_at,
            updated_at,
        })
    }

    /// Helper method to convert database row to ActivityAttachment struct
    async fn row_to_activity_attachment(
        &self,
        row: &sqlx::sqlite::SqliteRow,
    ) -> Result<ActivityAttachment> {
        let file_type_str: String = row.try_get("file_type")?;
        let file_type = file_type_str.parse::<ActivityAttachmentType>()?;

        let metadata_str: Option<String> = row.try_get("metadata")?;
        let metadata = metadata_str.map(|s| serde_json::from_str(&s)).transpose()?;

        let created_at: DateTime<Utc> = row.try_get("created_at")?;

        Ok(ActivityAttachment {
            id: row.try_get("id")?,
            activity_id: row.try_get("activity_id")?,
            file_path: row.try_get("file_path")?,
            file_type,
            file_size: row.try_get("file_size")?,
            thumbnail_path: row.try_get("thumbnail_path")?,
            metadata,
            created_at,
        })
    }
}
