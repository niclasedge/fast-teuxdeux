-- TeuxDeux Clone Database Schema
-- SQLite Database Schema for todo management system

-- Categories/Topics table for organizing todos
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT '#000000',
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Main todos table
CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    category_id INTEGER,
    scheduled_date DATE NULL, -- NULL for someday/topic-based todos
    sort_order INTEGER DEFAULT 0,
    color TEXT DEFAULT NULL, -- Individual todo color (optional)
    recurring_pattern TEXT DEFAULT NULL, -- 'daily', 'weekly', 'monthly', 'yearly', or custom pattern
    parent_id INTEGER DEFAULT NULL, -- For recurring todos, points to original
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (parent_id) REFERENCES todos(id) ON DELETE SET NULL
);

-- Migration tracking table
CREATE TABLE IF NOT EXISTS todo_migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    todo_id INTEGER NOT NULL,
    from_date DATE,
    to_date DATE,
    migrated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE
);

-- Insert default categories
INSERT OR IGNORE INTO categories (id, name, color, sort_order) VALUES 
(1, 'Personal', '#6b46c1', 1),
(2, 'Grocery List', '#059669', 2),
(3, 'Restaurants', '#dc2626', 3),
(4, 'Books to Read', '#7c2d12', 4),
(5, 'Things to Buy', '#1d4ed8', 5);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_todos_scheduled_date ON todos(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_todos_category_id ON todos(category_id);
CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos(completed);
CREATE INDEX IF NOT EXISTS idx_todos_created_at ON todos(created_at);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order);

-- Triggers to automatically update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_todos_updated_at 
    AFTER UPDATE ON todos
BEGIN
    UPDATE todos SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_categories_updated_at 
    AFTER UPDATE ON categories
BEGIN
    UPDATE categories SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;