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
        log::debug!(
            "[DB] create_activity: inserting activity for pet_id={}, category={}, subcategory={}",
            activity_data.pet_id,
            activity_data.category,
            activity_data.subcategory
        );

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
        .map_err(|e| {
            log::error!(
                "[DB] create_activity: insert failed for pet_id={}, error={}",
                activity_data.pet_id,
                e
            );
            ActivityError::InvalidData {
                message: format!("Database error: {e}"),
            }
        })?;

        let activity_id = result.last_insert_rowid();
        log::debug!("[DB] create_activity: inserted activity with id={activity_id}");

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
        log::debug!("[DB] get_activity_by_id: querying activity id={id}");

        let row = sqlx::query("SELECT * FROM activities WHERE id = ?")
            .bind(id)
            .fetch_optional(&self.pool)
            .await
            .map_err(|e| {
                log::error!("[DB] get_activity_by_id: query failed for id={id}, error={e}");
                ActivityError::InvalidData {
                    message: format!("Database error: {e}"),
                }
            })?;

        match row {
            Some(row) => {
                log::debug!("[DB] get_activity_by_id: found activity id={id}");
                self.row_to_activity(&row).await
            }
            None => {
                log::debug!("[DB] get_activity_by_id: activity not found id={id}");
                Err(ActivityError::NotFound { id })
            }
        }
    }

    /// Get activities with filtering and pagination
    pub async fn get_activities(
        &self,
        request: GetActivitiesRequest,
    ) -> Result<GetActivitiesResponse, ActivityError> {
        let limit = request.limit.unwrap_or(50).min(1000);
        let offset = request.offset.unwrap_or(0);

        log::debug!(
            "[DB] get_activities: querying activities pet_id={:?}, limit={}, offset={}",
            request.pet_id,
            limit,
            offset
        );

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
        .map_err(|e| {
            log::error!(
                "[DB] get_activities: query failed pet_id={:?}, error={}",
                request.pet_id,
                e
            );
            ActivityError::InvalidData {
                message: format!("Database error: {e}"),
            }
        })?;

        log::debug!("[DB] get_activities: fetched {} raw rows", rows.len());

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
        .map_err(|e| {
            log::error!(
                "[DB] get_activities: count query failed pet_id={:?}, error={}",
                request.pet_id,
                e
            );
            ActivityError::InvalidData {
                message: format!("Database error: {e}"),
            }
        })?;

        let has_more = (offset + activities.len() as i64) < total_count;

        log::debug!(
            "[DB] get_activities: returning {} activities, total_count={}, has_more={}",
            activities.len(),
            total_count,
            has_more
        );

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
        // Simple text search in activity_data JSON and subcategory
        let query = if request.pet_id.is_some() {
            "SELECT * FROM activities WHERE (activity_data LIKE ? OR subcategory LIKE ?) AND pet_id = ? ORDER BY created_at DESC LIMIT ?"
        } else {
            "SELECT * FROM activities WHERE (activity_data LIKE ? OR subcategory LIKE ?) ORDER BY created_at DESC LIMIT ?"
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
        log::debug!("[DB] delete_activity: deleting activity id={id}");

        // Check if activity exists
        let activity = self.get_activity_by_id(id).await?;
        log::debug!(
            "[DB] delete_activity: confirmed activity exists id={}, pet_id={}",
            id,
            activity.pet_id
        );

        let result = sqlx::query("DELETE FROM activities WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await
            .map_err(|e| {
                log::error!("[DB] delete_activity: delete failed id={id}, error={e}");
                ActivityError::InvalidData {
                    message: format!("Database error: {e}"),
                }
            })?;

        if result.rows_affected() == 0 {
            log::warn!("[DB] delete_activity: no rows affected for id={id}");
            return Err(ActivityError::NotFound { id });
        }

        log::debug!("[DB] delete_activity: successfully deleted activity id={id}");
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
            WHERE pet_id = ? AND created_at >= ?
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
            "SELECT * FROM activities WHERE pet_id = ? ORDER BY created_at DESC LIMIT 10",
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
                "SELECT * FROM activities WHERE pet_id = ? ORDER BY created_at DESC LIMIT ?",
            )
            .bind(pet_id)
            .bind(limit)
            .fetch_all(&self.pool)
            .await
        } else {
            sqlx::query("SELECT * FROM activities ORDER BY created_at DESC LIMIT ?")
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
            "SELECT * FROM activities WHERE pet_id = ? AND category = ? ORDER BY created_at DESC LIMIT ?"
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
            sqlx::query("SELECT * FROM activities WHERE pet_id = ? ORDER BY created_at ASC")
                .bind(pet_id)
                .fetch_all(&self.pool)
                .await
        } else {
            sqlx::query("SELECT * FROM activities ORDER BY pet_id, created_at ASC")
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
}
