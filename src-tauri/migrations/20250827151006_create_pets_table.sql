-- Add migration script here
-- Create pets table
CREATE TABLE IF NOT EXISTS pets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    birth_date DATE NOT NULL,
    species VARCHAR(20) NOT NULL CHECK (species IN ('cat', 'dog')),
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female', 'unknown')),
    breed VARCHAR(100),
    color VARCHAR(50),
    weight_kg REAL,
    photo_path VARCHAR(255),
    notes TEXT,
    display_order INTEGER DEFAULT 0,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_pets_display_order ON pets(display_order);
CREATE INDEX IF NOT EXISTS idx_pets_is_archived ON pets(is_archived);
