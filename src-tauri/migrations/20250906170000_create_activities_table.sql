-- Create activities table for pet activity tracking
CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pet_id INTEGER NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('health', 'growth', 'diet', 'lifestyle', 'expense')),
    subcategory VARCHAR(100) NOT NULL,
    activity_data TEXT, -- JSON data for category-specific information
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_activities_pet_id ON activities(pet_id);
CREATE INDEX IF NOT EXISTS idx_activities_category ON activities(category);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at);

-- Create FTS (Full-Text Search) virtual table for activities
CREATE VIRTUAL TABLE IF NOT EXISTS activities_fts USING fts5(
    subcategory,
    activity_data,
    content='activities',
    content_rowid='id'
);

-- Create triggers to keep FTS table synchronized with activities table
CREATE TRIGGER IF NOT EXISTS activities_fts_insert AFTER INSERT ON activities BEGIN
    INSERT INTO activities_fts(rowid, activity_data, subcategory)
    VALUES (new.id, new.activity_data, new.subcategory);
END;

CREATE TRIGGER IF NOT EXISTS activities_fts_delete AFTER DELETE ON activities BEGIN
    INSERT INTO activities_fts(activities_fts, rowid, activity_data, subcategory)
    VALUES ('delete', old.id, old.activity_data, old.subcategory);
END;

CREATE TRIGGER IF NOT EXISTS activities_fts_update AFTER UPDATE ON activities BEGIN
    INSERT INTO activities_fts(activities_fts, rowid, activity_data, subcategory)
    VALUES ('delete', old.id, old.activity_data, old.subcategory);
    INSERT INTO activities_fts(rowid, activity_data, subcategory)
    VALUES (new.id, new.activity_data, new.subcategory);
END;