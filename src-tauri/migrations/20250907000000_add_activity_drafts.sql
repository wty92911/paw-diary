-- Create activity_drafts table for supporting draft functionality
CREATE TABLE IF NOT EXISTS activity_drafts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pet_id INTEGER NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('health', 'growth', 'diet', 'lifestyle', 'expense')),
    subcategory VARCHAR(100),
    title VARCHAR(255),
    description TEXT,
    activity_date TIMESTAMP,
    activity_data TEXT, -- JSON data for category-specific information
    cost REAL,
    currency VARCHAR(10),
    location VARCHAR(255),
    mood_rating INTEGER CHECK (mood_rating >= 1 AND mood_rating <= 5),
    is_template BOOLEAN DEFAULT FALSE, -- Whether this draft serves as a template
    template_name VARCHAR(255), -- Name for template drafts
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
);

-- Create indexes for efficient draft queries
CREATE INDEX IF NOT EXISTS idx_activity_drafts_pet_id ON activity_drafts(pet_id);
CREATE INDEX IF NOT EXISTS idx_activity_drafts_category ON activity_drafts(category);
CREATE INDEX IF NOT EXISTS idx_activity_drafts_is_template ON activity_drafts(is_template);
CREATE INDEX IF NOT EXISTS idx_activity_drafts_created_at ON activity_drafts(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_drafts_pet_id_category ON activity_drafts(pet_id, category);

-- Create trigger to automatically update the updated_at timestamp
CREATE TRIGGER IF NOT EXISTS activity_drafts_update_timestamp 
AFTER UPDATE ON activity_drafts FOR EACH ROW
BEGIN
    UPDATE activity_drafts SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Create procedure for draft cleanup (remove drafts older than 30 days that aren't templates)
-- Note: SQLite doesn't support stored procedures, so this will be handled in Rust code
-- but we can add a view to help identify stale drafts

CREATE VIEW IF NOT EXISTS stale_drafts AS
SELECT id, pet_id, category, title, created_at
FROM activity_drafts
WHERE is_template = FALSE 
AND datetime(created_at) < datetime('now', '-30 days')
ORDER BY created_at ASC;