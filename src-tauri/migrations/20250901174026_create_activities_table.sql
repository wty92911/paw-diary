-- Add migration script here
-- Create activities table for pet activity recording system
CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pet_id INTEGER NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('health', 'growth', 'diet', 'lifestyle', 'expense')),
    subcategory VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    activity_date DATETIME NOT NULL,
    activity_data JSON, -- Category-specific structured data stored as JSON
    cost DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    location VARCHAR(200),
    mood_rating INTEGER CHECK (mood_rating BETWEEN 1 AND 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
);

-- Create activity_attachments table for photos and documents
CREATE TABLE IF NOT EXISTS activity_attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    activity_id INTEGER NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(20) NOT NULL CHECK (file_type IN ('photo', 'document', 'video')),
    file_size INTEGER,
    thumbnail_path VARCHAR(500),
    metadata JSON, -- File metadata stored as JSON
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE
);

-- Create full-text search virtual table for activities
CREATE VIRTUAL TABLE IF NOT EXISTS activities_fts USING fts5(
    title,
    description,
    category,
    subcategory,
    content='activities',
    content_rowid='id'
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_activities_pet_id ON activities(pet_id);
CREATE INDEX IF NOT EXISTS idx_activities_category ON activities(category);
CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_activities_pet_date ON activities(pet_id, activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_activities_cost ON activities(cost) WHERE cost IS NOT NULL;

-- Create indexes for activity_attachments
CREATE INDEX IF NOT EXISTS idx_attachments_activity_id ON activity_attachments(activity_id);
CREATE INDEX IF NOT EXISTS idx_attachments_file_type ON activity_attachments(file_type);

-- Create triggers to keep FTS table synchronized with activities table
CREATE TRIGGER IF NOT EXISTS activities_fts_insert AFTER INSERT ON activities BEGIN
    INSERT INTO activities_fts(rowid, title, description, category, subcategory)
    VALUES (new.id, new.title, new.description, new.category, new.subcategory);
END;

CREATE TRIGGER IF NOT EXISTS activities_fts_delete AFTER DELETE ON activities BEGIN
    INSERT INTO activities_fts(activities_fts, rowid, title, description, category, subcategory)
    VALUES ('delete', old.id, old.title, old.description, old.category, old.subcategory);
END;

CREATE TRIGGER IF NOT EXISTS activities_fts_update AFTER UPDATE ON activities BEGIN
    INSERT INTO activities_fts(activities_fts, rowid, title, description, category, subcategory)
    VALUES ('delete', old.id, old.title, old.description, old.category, old.subcategory);
    INSERT INTO activities_fts(rowid, title, description, category, subcategory)
    VALUES (new.id, new.title, new.description, new.category, new.subcategory);
END;

-- Create trigger to automatically update the updated_at timestamp
CREATE TRIGGER IF NOT EXISTS activities_updated_at AFTER UPDATE ON activities BEGIN
    UPDATE activities SET updated_at = CURRENT_TIMESTAMP WHERE id = new.id;
END;