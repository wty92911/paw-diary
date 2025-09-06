use super::{Activity, PetDatabase};
use crate::errors::ActivityError;
use anyhow::Result;
use serde::{Deserialize, Serialize};
use sqlx::Row;

/// Full-Text Search utilities for activities
impl PetDatabase {
    /// Rebuild the entire FTS index from scratch
    pub async fn rebuild_fts_index(&self) -> Result<FtsIndexStats, ActivityError> {
        log::info!("Starting FTS index rebuild");

        // Start a transaction
        let mut tx = self
            .pool
            .begin()
            .await
            .map_err(|e| ActivityError::InvalidData {
                message: format!("Transaction error: {e}"),
            })?;

        // Clear existing FTS data
        sqlx::query("DELETE FROM activities_fts")
            .execute(&mut *tx)
            .await
            .map_err(|e| ActivityError::InvalidData {
                message: format!("FTS clear error: {e}"),
            })?;

        // Get all activities and rebuild FTS index
        let rows =
            sqlx::query("SELECT id, title, description, subcategory, location FROM activities")
                .fetch_all(&mut *tx)
                .await
                .map_err(|e| ActivityError::InvalidData {
                    message: format!("Activities fetch error: {e}"),
                })?;

        let mut indexed_count = 0;
        for row in rows {
            let id: i64 = row.try_get("id").map_err(|e| ActivityError::InvalidData {
                message: format!("Invalid id: {e}"),
            })?;
            let title: String = row
                .try_get("title")
                .map_err(|e| ActivityError::InvalidData {
                    message: format!("Invalid title: {e}"),
                })?;
            let description: Option<String> = row.try_get("description").ok();
            let subcategory: String =
                row.try_get("subcategory")
                    .map_err(|e| ActivityError::InvalidData {
                        message: format!("Invalid subcategory: {e}"),
                    })?;
            let location: Option<String> = row.try_get("location").ok();

            sqlx::query(
                "INSERT INTO activities_fts(rowid, title, description, subcategory, location) VALUES (?, ?, ?, ?, ?)"
            )
            .bind(id)
            .bind(&title)
            .bind(&description)
            .bind(&subcategory)
            .bind(&location)
            .execute(&mut *tx)
            .await
            .map_err(|e| ActivityError::InvalidData { message: format!("FTS insert error: {e}") })?;

            indexed_count += 1;
        }

        // Optimize the FTS index
        sqlx::query("INSERT INTO activities_fts(activities_fts) VALUES('optimize')")
            .execute(&mut *tx)
            .await
            .map_err(|e| ActivityError::InvalidData {
                message: format!("FTS optimize error: {e}"),
            })?;

        // Commit the transaction
        tx.commit().await.map_err(|e| ActivityError::InvalidData {
            message: format!("Transaction commit error: {e}"),
        })?;

        log::info!("FTS index rebuild completed: {indexed_count} activities indexed");

        // Get index statistics
        self.get_fts_index_stats().await
    }

    /// Search activities using full-text search
    pub async fn fts_search_activities(
        &self,
        query: &str,
        limit: Option<i64>,
    ) -> Result<Vec<FtsSearchResult>, ActivityError> {
        let limit = limit.unwrap_or(50).min(1000);

        log::debug!("FTS search query: '{query}', limit: {limit}");

        // Sanitize query to prevent FTS injection
        let sanitized_query = self.sanitize_fts_query(query);

        let rows = sqlx::query(
            r#"
            SELECT 
                a.id, a.pet_id, a.category, a.subcategory, a.title, a.description, 
                a.activity_date, a.activity_data, a.cost, a.currency, a.location, 
                a.mood_rating, a.created_at, a.updated_at,
                fts.rank
            FROM activities_fts fts
            JOIN activities a ON a.id = fts.rowid
            WHERE activities_fts MATCH ?
            ORDER BY fts.rank
            LIMIT ?
            "#,
        )
        .bind(&sanitized_query)
        .bind(limit)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| ActivityError::InvalidData {
            message: format!("FTS search error: {e}"),
        })?;

        let mut results = Vec::new();
        for row in rows {
            // Get activity ID and fetch the full activity record
            let activity_id: i64 = row.try_get("id").map_err(|e| ActivityError::InvalidData {
                message: format!("Invalid id: {e}"),
            })?;
            let activity = self.get_activity_by_id(activity_id).await?;
            let rank: f64 = row
                .try_get("rank")
                .map_err(|e| ActivityError::InvalidData {
                    message: format!("Invalid rank: {e}"),
                })?;

            results.push(FtsSearchResult {
                activity,
                rank,
                matched_fields: vec!["title".to_string()], // Simplified
            });
        }

        log::debug!("FTS search completed: {} results", results.len());
        Ok(results)
    }

    /// Get FTS index statistics
    pub async fn get_fts_index_stats(&self) -> Result<FtsIndexStats, ActivityError> {
        // Get number of indexed documents
        let doc_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM activities_fts")
            .fetch_one(&self.pool)
            .await
            .map_err(|e| ActivityError::InvalidData {
                message: format!("FTS count error: {e}"),
            })?;

        // Rough estimation of index size
        let estimated_size_mb = (doc_count as f64 * 0.5) / 1024.0;

        // Get integrity check
        let integrity_result = sqlx::query_scalar::<_, String>(
            "SELECT 'ok' FROM activities_fts WHERE activities_fts MATCH 'test' LIMIT 1",
        )
        .fetch_optional(&self.pool)
        .await;

        let integrity_ok = integrity_result.is_ok();

        Ok(FtsIndexStats {
            document_count: doc_count,
            index_size_mb: estimated_size_mb,
            integrity_ok,
            last_updated: chrono::Utc::now(),
        })
    }

    /// Verify FTS index integrity
    pub async fn verify_fts_integrity(&self) -> Result<FtsIntegrityResult, ActivityError> {
        log::debug!("Verifying FTS index integrity");

        // Check if FTS table exists and is accessible
        let fts_accessible = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM activities_fts")
            .fetch_one(&self.pool)
            .await
            .is_ok();

        if !fts_accessible {
            return Ok(FtsIntegrityResult {
                is_valid: false,
                issues: vec!["FTS table is not accessible".to_string()],
                activities_count: 0,
                fts_count: 0,
                duration_ms: 0,
            });
        }

        // Get counts from both tables
        let activities_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM activities")
            .fetch_one(&self.pool)
            .await
            .map_err(|e| ActivityError::InvalidData {
                message: format!("Activities count error: {e}"),
            })?;

        let fts_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM activities_fts")
            .fetch_one(&self.pool)
            .await
            .map_err(|e| ActivityError::InvalidData {
                message: format!("FTS count error: {e}"),
            })?;

        let mut issues = Vec::new();

        // Check if counts match
        if activities_count != fts_count {
            issues.push(format!(
                "Count mismatch: {activities_count} activities vs {fts_count} FTS entries"
            ));
        }

        // Check for orphaned FTS entries
        let orphaned_fts: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM activities_fts WHERE rowid NOT IN (SELECT id FROM activities)",
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| ActivityError::InvalidData {
            message: format!("Orphaned FTS check error: {e}"),
        })?;

        if orphaned_fts > 0 {
            issues.push(format!("Found {orphaned_fts} orphaned FTS entries"));
        }

        // Check for missing FTS entries
        let missing_fts: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM activities WHERE id NOT IN (SELECT rowid FROM activities_fts)",
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| ActivityError::InvalidData {
            message: format!("Missing FTS check error: {e}"),
        })?;

        if missing_fts > 0 {
            issues.push(format!(
                "Found {missing_fts} activities missing from FTS index"
            ));
        }

        let is_valid = issues.is_empty();
        log::debug!(
            "FTS integrity check: {} (activities: {}, fts: {})",
            if is_valid { "VALID" } else { "INVALID" },
            activities_count,
            fts_count
        );

        Ok(FtsIntegrityResult {
            is_valid,
            issues,
            activities_count,
            fts_count,
            duration_ms: 0,
        })
    }

    /// Repair FTS index by rebuilding inconsistent entries
    pub async fn repair_fts_index(&self) -> Result<FtsRepairResult, ActivityError> {
        log::info!("Starting FTS index repair");

        // First, verify what needs to be repaired
        let integrity = self.verify_fts_integrity().await?;

        if integrity.is_valid {
            log::info!("FTS index is already consistent, no repair needed");
            return Ok(FtsRepairResult {
                repaired_entries: 0,
                removed_orphans: 0,
                added_missing: 0,
                duration_ms: 0,
            });
        }

        let mut removed_orphans = 0;
        let mut added_missing = 0;

        // Start a transaction
        let mut tx = self
            .pool
            .begin()
            .await
            .map_err(|e| ActivityError::InvalidData {
                message: format!("Transaction error: {e}"),
            })?;

        // Remove orphaned FTS entries
        let orphaned_result = sqlx::query(
            "DELETE FROM activities_fts WHERE rowid NOT IN (SELECT id FROM activities)",
        )
        .execute(&mut *tx)
        .await
        .map_err(|e| ActivityError::InvalidData {
            message: format!("Remove orphans error: {e}"),
        })?;

        removed_orphans = orphaned_result.rows_affected() as i64;

        // Add missing FTS entries
        let missing_activities = sqlx::query(
            "SELECT id, title, description, subcategory, location FROM activities WHERE id NOT IN (SELECT rowid FROM activities_fts)"
        )
        .fetch_all(&mut *tx)
        .await
        .map_err(|e| ActivityError::InvalidData { message: format!("Missing activities fetch error: {e}") })?;

        for row in missing_activities {
            let id: i64 = row.try_get("id").map_err(|e| ActivityError::InvalidData {
                message: format!("Invalid id: {e}"),
            })?;
            let title: String = row
                .try_get("title")
                .map_err(|e| ActivityError::InvalidData {
                    message: format!("Invalid title: {e}"),
                })?;
            let description: Option<String> = row.try_get("description").ok();
            let subcategory: String =
                row.try_get("subcategory")
                    .map_err(|e| ActivityError::InvalidData {
                        message: format!("Invalid subcategory: {e}"),
                    })?;
            let location: Option<String> = row.try_get("location").ok();

            sqlx::query(
                "INSERT INTO activities_fts(rowid, title, description, subcategory, location) VALUES (?, ?, ?, ?, ?)"
            )
            .bind(id)
            .bind(&title)
            .bind(&description)
            .bind(&subcategory)
            .bind(&location)
            .execute(&mut *tx)
            .await
            .map_err(|e| ActivityError::InvalidData { message: format!("FTS repair insert error: {e}") })?;

            added_missing += 1;
        }

        let repaired_entries = removed_orphans + added_missing;

        // Optimize the index after repair
        if repaired_entries > 0 {
            sqlx::query("INSERT INTO activities_fts(activities_fts) VALUES('optimize')")
                .execute(&mut *tx)
                .await
                .map_err(|e| ActivityError::InvalidData {
                    message: format!("FTS optimize error: {e}"),
                })?;
        }

        // Commit the transaction
        tx.commit().await.map_err(|e| ActivityError::InvalidData {
            message: format!("Transaction commit error: {e}"),
        })?;

        log::info!("FTS index repair completed: {repaired_entries} entries repaired ({removed_orphans} orphans removed, {added_missing} missing added)");

        Ok(FtsRepairResult {
            repaired_entries,
            removed_orphans,
            added_missing,
            duration_ms: 0,
        })
    }

    /// Sanitize FTS query to prevent injection and improve search quality
    fn sanitize_fts_query(&self, query: &str) -> String {
        // Remove potentially harmful characters and normalize the query
        let cleaned = query
            .chars()
            .filter(|c| c.is_alphanumeric() || c.is_whitespace() || "-_*\"".contains(*c))
            .collect::<String>();

        // If the query looks like a phrase, wrap it in quotes
        if cleaned.contains(' ') && !cleaned.contains('"') {
            format!("\"{}\"", cleaned.trim())
        } else {
            cleaned.trim().to_string()
        }
    }
}

/// FTS search result with relevance ranking
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FtsSearchResult {
    pub activity: Activity,
    pub rank: f64,
    pub matched_fields: Vec<String>,
}

/// FTS index statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FtsIndexStats {
    pub document_count: i64,
    pub index_size_mb: f64,
    pub integrity_ok: bool,
    pub last_updated: chrono::DateTime<chrono::Utc>,
}

/// FTS integrity check result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FtsIntegrityResult {
    pub is_valid: bool,
    pub issues: Vec<String>,
    pub activities_count: i64,
    pub fts_count: i64,
    pub duration_ms: u64,
}

/// FTS repair operation result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FtsRepairResult {
    pub repaired_entries: i64,
    pub removed_orphans: i64,
    pub added_missing: i64,
    pub duration_ms: u64,
}
