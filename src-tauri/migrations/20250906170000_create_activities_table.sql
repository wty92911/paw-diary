-- Create activities table for pet activity tracking
CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pet_id INTEGER NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('health', 'growth', 'diet', 'lifestyle', 'expense')),
    subcategory VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    activity_date TIMESTAMP NOT NULL,
    activity_data TEXT, -- JSON data for category-specific information
    cost REAL,
    currency VARCHAR(10),
    location VARCHAR(255),
    mood_rating INTEGER CHECK (mood_rating >= 1 AND mood_rating <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_activities_pet_id ON activities(pet_id);
CREATE INDEX IF NOT EXISTS idx_activities_category ON activities(category);
CREATE INDEX IF NOT EXISTS idx_activities_activity_date ON activities(activity_date);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at);
CREATE INDEX IF NOT EXISTS idx_activities_pet_id_date ON activities(pet_id, activity_date);

-- Create FTS (Full-Text Search) virtual table for activities
CREATE VIRTUAL TABLE IF NOT EXISTS activities_fts USING fts5(
    title,
    description,
    subcategory,
    location,
    content='activities',
    content_rowid='id'
);

-- Create triggers to keep FTS table synchronized with activities table
CREATE TRIGGER IF NOT EXISTS activities_fts_insert AFTER INSERT ON activities BEGIN
    INSERT INTO activities_fts(rowid, title, description, subcategory, location)
    VALUES (new.id, new.title, new.description, new.subcategory, new.location);
END;

CREATE TRIGGER IF NOT EXISTS activities_fts_delete AFTER DELETE ON activities BEGIN
    INSERT INTO activities_fts(activities_fts, rowid, title, description, subcategory, location)
    VALUES ('delete', old.id, old.title, old.description, old.subcategory, old.location);
END;

CREATE TRIGGER IF NOT EXISTS activities_fts_update AFTER UPDATE ON activities BEGIN
    INSERT INTO activities_fts(activities_fts, rowid, title, description, subcategory, location)
    VALUES ('delete', old.id, old.title, old.description, old.subcategory, old.location);
    INSERT INTO activities_fts(rowid, title, description, subcategory, location)
    VALUES (new.id, new.title, new.description, new.subcategory, new.location);
END;