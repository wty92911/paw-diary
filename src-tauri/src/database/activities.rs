use super::models::*;
use crate::errors::ActivityError;
use anyhow::Result;
use chrono::{DateTime, Utc};
use sqlx::Row;

impl super::PetDatabase {
    /// Create a new activity
    pub async fn create_activity(
        &self,
        activity_data: ActivityCreateRequest,
    ) -> Result<Activity, ActivityError> {
        let now = Utc::now();

        // Insert the activity
        let result = sqlx::query(
            r#"
            INSERT INTO activities (
                pet_id, category, subcategory, activity_data, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(activity_data.pet_id)
        .bind(activity_data.category.to_string())
        .bind(&activity_data.subcategory)
        .bind(activity_data.activity_data.as_ref().map(|v| v.to_string()))
        .bind(now)
        .bind(now)
        .execute(&self.pool)
        .await
        .map_err(|e| ActivityError::InvalidData {
            message: format!("Database error: {e}"),
        })?;

        let activity_id = result.last_insert_rowid();
        self.get_activity_by_id(activity_id).await
    }

    /// Update an existing activity
    pub async fn update_activity(
        &self,
        id: i64,
        activity_data: ActivityUpdateRequest,
    ) -> Result<Activity, ActivityError> {
        let now = Utc::now();

        // Check if activity exists
        let _ = self.get_activity_by_id(id).await?;

        // Build dynamic update query
        let mut updates = Vec::new();

        if activity_data.subcategory.is_some() {
            updates.push("subcategory = ?");
        }
        if activity_data.activity_data.is_some() {
            updates.push("activity_data = ?");
        }

        if !updates.is_empty() {
            let query_sql = format!(
                "UPDATE activities SET {}, updated_at = ? WHERE id = ?",
                updates.join(", ")
            );

            let mut query = sqlx::query(&query_sql);

            // Add bindings in the same order as updates
            if let Some(subcategory) = activity_data.subcategory {
                query = query.bind(subcategory);
            }
            if let Some(activity_data_json) = activity_data.activity_data {
                query = query.bind(activity_data_json.to_string());
            }

            query = query.bind(now).bind(id);
            query
                .execute(&self.pool)
                .await
                .map_err(|e| ActivityError::InvalidData {
                    message: format!("Database error: {e}"),
                })?;
        }

        self.get_activity_by_id(id).await
    }

    /// Get an activity by ID
    pub async fn get_activity_by_id(&self, id: i64) -> Result<Activity, ActivityError> {
        let row = sqlx::query("SELECT * FROM activities WHERE id = ?")
            .bind(id)
            .fetch_optional(&self.pool)
            .await
            .map_err(|e| ActivityError::InvalidData {
                message: format!("Database error: {e}"),
            })?;

        match row {
            Some(row) => self.row_to_activity(&row).await,
            None => Err(ActivityError::NotFound { id }),
        }
    }

    /// Get activities with filtering and pagination
    pub async fn get_activities(
        &self,
        request: GetActivitiesRequest,
    ) -> Result<GetActivitiesResponse, ActivityError> {
        // Simple implementation - just get recent activities for the pet
        let limit = request.limit.unwrap_or(50).min(1000);
        let offset = request.offset.unwrap_or(0);

        let query = if let Some(_pet_id) = request.pet_id {
            "SELECT * FROM activities WHERE pet_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?"
        } else {
            "SELECT * FROM activities ORDER BY created_at DESC LIMIT ? OFFSET ?"
        };

        let rows = if let Some(pet_id) = request.pet_id {
            sqlx::query(query)
                .bind(pet_id)
                .bind(limit)
                .bind(offset)
                .fetch_all(&self.pool)
                .await
        } else {
            sqlx::query(query)
                .bind(limit)
                .bind(offset)
                .fetch_all(&self.pool)
                .await
        }
        .map_err(|e| ActivityError::InvalidData {
            message: format!("Database error: {e}"),
        })?;

        let mut activities = Vec::new();
        for row in rows {
            activities.push(self.row_to_activity(&row).await?);
        }

        // Simple count query
        let total_count: i64 = if let Some(pet_id) = request.pet_id {
            sqlx::query_scalar("SELECT COUNT(*) FROM activities WHERE pet_id = ?")
                .bind(pet_id)
                .fetch_one(&self.pool)
                .await
        } else {
            sqlx::query_scalar("SELECT COUNT(*) FROM activities")
                .fetch_one(&self.pool)
                .await
        }
        .map_err(|e| ActivityError::InvalidData {
            message: format!("Database error: {e}"),
        })?;

        let has_more = (offset + activities.len() as i64) < total_count;
        Ok(GetActivitiesResponse {
            activities,
            total_count,
            has_more,
        })
    }

    /// Search activities by text
    pub async fn search_activities(
        &self,
        request: SearchActivitiesRequest,
    ) -> Result<Vec<Activity>, ActivityError> {
        // Simple text search in title and description
        let query = if request.pet_id.is_some() {
            "SELECT * FROM activities WHERE (title LIKE ? OR description LIKE ?) AND pet_id = ? ORDER BY activity_date DESC LIMIT ?"
        } else {
            "SELECT * FROM activities WHERE (title LIKE ? OR description LIKE ?) ORDER BY activity_date DESC LIMIT ?"
        };

        let search_term = format!("%{}%", request.query);
        let limit = request.limit.unwrap_or(50).min(1000);

        let rows = if let Some(pet_id) = request.pet_id {
            sqlx::query(query)
                .bind(&search_term)
                .bind(&search_term)
                .bind(pet_id)
                .bind(limit)
                .fetch_all(&self.pool)
                .await
        } else {
            sqlx::query(query)
                .bind(&search_term)
                .bind(&search_term)
                .bind(limit)
                .fetch_all(&self.pool)
                .await
        }
        .map_err(|e| ActivityError::InvalidData {
            message: format!("Database error: {e}"),
        })?;

        let mut activities = Vec::new();
        for row in rows {
            activities.push(self.row_to_activity(&row).await?);
        }

        Ok(activities)
    }

    /// Delete an activity
    pub async fn delete_activity(&self, id: i64) -> Result<(), ActivityError> {
        // Check if activity exists
        let _ = self.get_activity_by_id(id).await?;

        let result = sqlx::query("DELETE FROM activities WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await
            .map_err(|e| ActivityError::InvalidData {
                message: format!("Database error: {e}"),
            })?;

        if result.rows_affected() == 0 {
            return Err(ActivityError::NotFound { id });
        }

        Ok(())
    }

    /// Get activity statistics for a pet
    pub async fn get_activity_stats(
        &self,
        pet_id: i64,
        days: Option<i64>,
    ) -> Result<ActivityStatsResponse, ActivityError> {
        let days = days.unwrap_or(30);
        let since_date = Utc::now() - chrono::Duration::days(days);

        // Get activity count by category
        let rows = sqlx::query(
            r#"
            SELECT category, COUNT(*) as count 
            FROM activities 
            WHERE pet_id = ? AND activity_date >= ?
            GROUP BY category
            "#,
        )
        .bind(pet_id)
        .bind(since_date.format("%Y-%m-%d %H:%M:%S").to_string())
        .fetch_all(&self.pool)
        .await
        .map_err(|e| ActivityError::InvalidData {
            message: format!("Database error: {e}"),
        })?;

        let mut category_counts = std::collections::HashMap::new();
        let mut total_activities = 0;

        for row in rows {
            let category: String =
                row.try_get("category")
                    .map_err(|e| ActivityError::InvalidData {
                        message: format!("Invalid category: {e}"),
                    })?;
            let count: i64 = row
                .try_get("count")
                .map_err(|e| ActivityError::InvalidData {
                    message: format!("Invalid count: {e}"),
                })?;

            category_counts.insert(category, count);
            total_activities += count;
        }

        // Get recent activities
        let recent_rows = sqlx::query(
            "SELECT * FROM activities WHERE pet_id = ? ORDER BY activity_date DESC LIMIT 10",
        )
        .bind(pet_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| ActivityError::InvalidData {
            message: format!("Database error: {e}"),
        })?;

        let mut recent_activities = Vec::new();
        for row in recent_rows {
            recent_activities.push(self.row_to_activity(&row).await?);
        }

        Ok(ActivityStatsResponse {
            total_activities,
            category_counts,
            recent_activities,
            date_range_days: days,
        })
    }

    /// Get recent activities across all pets or for a specific pet
    pub async fn get_recent_activities(
        &self,
        pet_id: Option<i64>,
        limit: Option<i64>,
    ) -> Result<Vec<Activity>, ActivityError> {
        let limit = limit.unwrap_or(20).min(100);

        let rows = if let Some(pet_id) = pet_id {
            sqlx::query(
                "SELECT * FROM activities WHERE pet_id = ? ORDER BY activity_date DESC LIMIT ?",
            )
            .bind(pet_id)
            .bind(limit)
            .fetch_all(&self.pool)
            .await
        } else {
            sqlx::query("SELECT * FROM activities ORDER BY activity_date DESC LIMIT ?")
                .bind(limit)
                .fetch_all(&self.pool)
                .await
        }
        .map_err(|e| ActivityError::InvalidData {
            message: format!("Database error: {e}"),
        })?;

        let mut activities = Vec::new();
        for row in rows {
            activities.push(self.row_to_activity(&row).await?);
        }

        Ok(activities)
    }

    /// Get activities by category for a specific pet
    pub async fn get_activities_by_category(
        &self,
        pet_id: i64,
        category: ActivityCategory,
        limit: Option<i64>,
    ) -> Result<Vec<Activity>, ActivityError> {
        let limit = limit.unwrap_or(50).min(1000);

        let rows = sqlx::query(
            "SELECT * FROM activities WHERE pet_id = ? AND category = ? ORDER BY activity_date DESC LIMIT ?"
        )
        .bind(pet_id)
        .bind(category.to_string())
        .bind(limit)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| ActivityError::InvalidData {
            message: format!("Database error: {e}"),
        })?;

        let mut activities = Vec::new();
        for row in rows {
            activities.push(self.row_to_activity(&row).await?);
        }

        Ok(activities)
    }

    /// Export activities for backup/migration
    pub async fn export_activities(
        &self,
        request: ExportActivitiesRequest,
    ) -> Result<Vec<Activity>, ActivityError> {
        let rows = if let Some(pet_id) = request.pet_id {
            sqlx::query("SELECT * FROM activities WHERE pet_id = ? ORDER BY activity_date ASC")
                .bind(pet_id)
                .fetch_all(&self.pool)
                .await
        } else {
            sqlx::query("SELECT * FROM activities ORDER BY pet_id, activity_date ASC")
                .fetch_all(&self.pool)
                .await
        }
        .map_err(|e| ActivityError::InvalidData {
            message: format!("Database error: {e}"),
        })?;

        let mut activities = Vec::new();
        for row in rows {
            activities.push(self.row_to_activity(&row).await?);
        }

        Ok(activities)
    }

    /// Helper method to convert database row to Activity struct
    async fn row_to_activity(
        &self,
        row: &sqlx::sqlite::SqliteRow,
    ) -> Result<Activity, ActivityError> {
        let category_str: String =
            row.try_get("category")
                .map_err(|e| ActivityError::InvalidData {
                    message: format!("Invalid category: {e}"),
                })?;
        let category =
            category_str
                .parse::<ActivityCategory>()
                .map_err(|_| ActivityError::InvalidType {
                    activity_type: category_str,
                })?;

        let created_at: DateTime<Utc> =
            row.try_get("created_at")
                .map_err(|e| ActivityError::InvalidData {
                    message: format!("Invalid created_at: {e}"),
                })?;
        let updated_at: DateTime<Utc> =
            row.try_get("updated_at")
                .map_err(|e| ActivityError::InvalidData {
                    message: format!("Invalid updated_at: {e}"),
                })?;

        Ok(Activity {
            id: row.try_get("id").map_err(|e| ActivityError::InvalidData {
                message: format!("Invalid id: {e}"),
            })?,
            pet_id: row
                .try_get("pet_id")
                .map_err(|e| ActivityError::InvalidData {
                    message: format!("Invalid pet_id: {e}"),
                })?,
            category,
            subcategory: row
                .try_get("subcategory")
                .map_err(|e| ActivityError::InvalidData {
                    message: format!("Invalid subcategory: {e}"),
                })?,
            activity_data: row.try_get("activity_data").map_err(|e| {
                ActivityError::InvalidData {
                    message: format!("Invalid activity_data: {e}"),
                }
            })?,
            created_at,
            updated_at,
        })
    }

    // Activity Draft Management Methods

    /// Create a new activity draft
    pub async fn create_activity_draft(
        &self,
        draft_data: ActivityDraftCreateRequest,
    ) -> Result<ActivityDraft, ActivityError> {
        let now = Utc::now();

        let result = sqlx::query(
            r#"
            INSERT INTO activity_drafts (
                pet_id, category, subcategory, title, description, activity_date, 
                activity_data, cost, currency, location, mood_rating, 
                is_template, template_name, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(draft_data.pet_id)
        .bind(draft_data.category.to_string())
        .bind(&draft_data.subcategory)
        .bind(&draft_data.title)
        .bind(&draft_data.description)
        .bind(
            draft_data
                .activity_date
                .map(|d| d.format("%Y-%m-%d %H:%M:%S").to_string()),
        )
        .bind(draft_data.activity_data.as_ref().map(|v| v.to_string()))
        .bind(draft_data.cost)
        .bind(&draft_data.currency)
        .bind(&draft_data.location)
        .bind(draft_data.mood_rating)
        .bind(draft_data.is_template.unwrap_or(false))
        .bind(&draft_data.template_name)
        .bind(now)
        .bind(now)
        .execute(&self.pool)
        .await
        .map_err(|e| ActivityError::InvalidData {
            message: format!("Database error: {e}"),
        })?;

        let draft_id = result.last_insert_rowid();
        self.get_activity_draft_by_id(draft_id).await
    }

    /// Update an existing activity draft
    pub async fn update_activity_draft(
        &self,
        draft_id: i64,
        updates: ActivityDraftUpdateRequest,
    ) -> Result<ActivityDraft, ActivityError> {
        let now = Utc::now();

        // Build dynamic query based on what fields are being updated
        let mut query_parts = vec!["UPDATE activity_drafts SET updated_at = ?"];
        let mut bind_values: Vec<String> = vec![now.to_rfc3339()];

        if let Some(category) = &updates.category {
            query_parts.push(", category = ?");
            bind_values.push(category.to_string());
        }
        if updates.subcategory.is_some() {
            query_parts.push(", subcategory = ?");
            bind_values.push(updates.subcategory.clone().unwrap_or_default());
        }
        if updates.title.is_some() {
            query_parts.push(", title = ?");
            bind_values.push(updates.title.clone().unwrap_or_default());
        }
        if updates.description.is_some() {
            query_parts.push(", description = ?");
            bind_values.push(updates.description.clone().unwrap_or_default());
        }
        if let Some(activity_date) = &updates.activity_date {
            query_parts.push(", activity_date = ?");
            bind_values.push(activity_date.format("%Y-%m-%d %H:%M:%S").to_string());
        }
        if let Some(activity_data) = &updates.activity_data {
            query_parts.push(", activity_data = ?");
            bind_values.push(activity_data.to_string());
        }
        if updates.cost.is_some() {
            query_parts.push(", cost = ?");
            bind_values.push(updates.cost.unwrap_or(0.0).to_string());
        }
        if updates.currency.is_some() {
            query_parts.push(", currency = ?");
            bind_values.push(updates.currency.clone().unwrap_or_default());
        }
        if updates.location.is_some() {
            query_parts.push(", location = ?");
            bind_values.push(updates.location.clone().unwrap_or_default());
        }
        if updates.mood_rating.is_some() {
            query_parts.push(", mood_rating = ?");
            bind_values.push(updates.mood_rating.unwrap_or(0).to_string());
        }
        if let Some(is_template) = updates.is_template {
            query_parts.push(", is_template = ?");
            bind_values.push(is_template.to_string());
        }
        if updates.template_name.is_some() {
            query_parts.push(", template_name = ?");
            bind_values.push(updates.template_name.clone().unwrap_or_default());
        }

        query_parts.push(" WHERE id = ?");
        bind_values.push(draft_id.to_string());

        let query_str = query_parts.join("");

        // Execute query with all the bind values
        let mut query = sqlx::query(&query_str);
        for value in &bind_values {
            query = query.bind(value);
        }

        query
            .execute(&self.pool)
            .await
            .map_err(|e| ActivityError::InvalidData {
                message: format!("Database error: {e}"),
            })?;

        self.get_activity_draft_by_id(draft_id).await
    }

    /// Get an activity draft by ID
    pub async fn get_activity_draft_by_id(
        &self,
        draft_id: i64,
    ) -> Result<ActivityDraft, ActivityError> {
        let row = sqlx::query(
            r#"
            SELECT id, pet_id, category, subcategory, title, description, activity_date,
                   activity_data, cost, currency, location, mood_rating,
                   is_template, template_name, created_at, updated_at
            FROM activity_drafts
            WHERE id = ?
            "#,
        )
        .bind(draft_id)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| match e {
            sqlx::Error::RowNotFound => ActivityError::NotFound { id: draft_id },
            _ => ActivityError::InvalidData {
                message: format!("Database error: {e}"),
            },
        })?;

        Self::row_to_activity_draft(row)
    }

    /// Get activity drafts for a specific pet
    pub async fn get_activity_drafts_for_pet(
        &self,
        pet_id: i64,
        include_templates: bool,
        limit: Option<i64>,
        offset: Option<i64>,
    ) -> Result<Vec<ActivityDraft>, ActivityError> {
        let limit = limit.unwrap_or(20);
        let offset = offset.unwrap_or(0);

        let mut query = String::from(
            r#"
            SELECT id, pet_id, category, subcategory, title, description, activity_date,
                   activity_data, cost, currency, location, mood_rating,
                   is_template, template_name, created_at, updated_at
            FROM activity_drafts
            WHERE pet_id = ?
            "#,
        );

        if !include_templates {
            query.push_str(" AND is_template = FALSE");
        }

        query.push_str(" ORDER BY created_at DESC LIMIT ? OFFSET ?");

        let rows = sqlx::query(&query)
            .bind(pet_id)
            .bind(limit)
            .bind(offset)
            .fetch_all(&self.pool)
            .await
            .map_err(|e| ActivityError::InvalidData {
                message: format!("Database error: {e}"),
            })?;

        let mut drafts = Vec::new();
        for row in rows {
            drafts.push(Self::row_to_activity_draft(row)?);
        }

        Ok(drafts)
    }

    /// Delete an activity draft
    pub async fn delete_activity_draft(&self, draft_id: i64) -> Result<(), ActivityError> {
        let result = sqlx::query("DELETE FROM activity_drafts WHERE id = ?")
            .bind(draft_id)
            .execute(&self.pool)
            .await
            .map_err(|e| ActivityError::InvalidData {
                message: format!("Database error: {e}"),
            })?;

        if result.rows_affected() == 0 {
            return Err(ActivityError::NotFound { id: draft_id });
        }

        Ok(())
    }

    /// Clean up old activity drafts (excluding templates)
    pub async fn cleanup_old_drafts(&self, days_old: i64) -> Result<i64, ActivityError> {
        let result = sqlx::query(
            r#"
            DELETE FROM activity_drafts 
            WHERE is_template = FALSE 
              AND datetime(created_at) < datetime('now', '-' || ? || ' days')
            "#,
        )
        .bind(days_old)
        .execute(&self.pool)
        .await
        .map_err(|e| ActivityError::InvalidData {
            message: format!("Database error: {e}"),
        })?;

        Ok(result.rows_affected() as i64)
    }

    /// Helper function to convert a database row to ActivityDraft
    fn row_to_activity_draft(row: sqlx::sqlite::SqliteRow) -> Result<ActivityDraft, ActivityError> {
        // Parse category
        let category_str: String =
            row.try_get("category")
                .map_err(|e| ActivityError::InvalidData {
                    message: format!("Invalid category: {e}"),
                })?;
        let category =
            category_str
                .parse()
                .map_err(|e: anyhow::Error| ActivityError::InvalidData {
                    message: format!("Invalid category value: {e}"),
                })?;

        // Parse activity_date (optional for drafts)
        let activity_date = match row
            .try_get::<Option<String>, _>("activity_date")
            .ok()
            .flatten()
        {
            Some(date_str) => Some(
                DateTime::parse_from_str(&date_str, "%Y-%m-%d %H:%M:%S")
                    .map_err(|e| ActivityError::InvalidData {
                        message: format!("Invalid activity_date format: {e}"),
                    })?
                    .with_timezone(&Utc),
            ),
            None => None,
        };

        // Parse activity_data JSON (optional)
        let activity_data: Option<String> = row.try_get("activity_data").ok().flatten();
        let activity_data = match activity_data {
            Some(json_str) if !json_str.is_empty() => Some(
                serde_json::from_str(&json_str).map_err(|e| ActivityError::InvalidData {
                    message: format!("Invalid activity_data JSON: {e}"),
                })?,
            ),
            _ => None,
        };

        // Parse timestamps
        let created_at: DateTime<Utc> =
            row.try_get("created_at")
                .map_err(|e| ActivityError::InvalidData {
                    message: format!("Invalid created_at: {e}"),
                })?;
        let updated_at: DateTime<Utc> =
            row.try_get("updated_at")
                .map_err(|e| ActivityError::InvalidData {
                    message: format!("Invalid updated_at: {e}"),
                })?;

        Ok(ActivityDraft {
            id: row.try_get("id").map_err(|e| ActivityError::InvalidData {
                message: format!("Invalid id: {e}"),
            })?,
            pet_id: row
                .try_get("pet_id")
                .map_err(|e| ActivityError::InvalidData {
                    message: format!("Invalid pet_id: {e}"),
                })?,
            category,
            subcategory: row.try_get("subcategory").ok(),
            title: row.try_get("title").ok(),
            description: row.try_get("description").ok(),
            activity_date,
            activity_data,
            cost: row.try_get("cost").ok(),
            currency: row.try_get("currency").ok(),
            location: row.try_get("location").ok(),
            mood_rating: row.try_get("mood_rating").ok(),
            is_template: row
                .try_get("is_template")
                .map_err(|e| ActivityError::InvalidData {
                    message: format!("Invalid is_template: {e}"),
                })?,
            template_name: row.try_get("template_name").ok(),
            created_at,
            updated_at,
        })
    }
}
