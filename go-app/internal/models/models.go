package models

import (
	"database/sql"
	"time"
)

// Category represents a todo category/topic
type Category struct {
	ID        int       `json:"id" db:"id"`
	Name      string    `json:"name" db:"name"`
	Color     string    `json:"color" db:"color"`
	SortOrder int       `json:"sort_order" db:"sort_order"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

// Todo represents a single todo item
type Todo struct {
	ID               int            `json:"id" db:"id"`
	Title            string         `json:"title" db:"title"`
	Completed        bool           `json:"completed" db:"completed"`
	CategoryID       sql.NullInt64  `json:"category_id" db:"category_id"`
	CategoryName     string         `json:"category_name,omitempty"`
	CategoryColor    string         `json:"category_color,omitempty"`
	ScheduledDate    sql.NullString `json:"scheduled_date" db:"scheduled_date"`
	SortOrder        int            `json:"sort_order" db:"sort_order"`
	Color            sql.NullString `json:"color" db:"color"`
	RecurringPattern sql.NullString `json:"recurring_pattern" db:"recurring_pattern"`
	ParentID         sql.NullInt64  `json:"parent_id" db:"parent_id"`
	CreatedAt        time.Time      `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at" db:"updated_at"`
}

// TodoMigration represents the migration history of todos between dates
type TodoMigration struct {
	ID          int            `json:"id" db:"id"`
	TodoID      int            `json:"todo_id" db:"todo_id"`
	FromDate    sql.NullString `json:"from_date" db:"from_date"`
	ToDate      sql.NullString `json:"to_date" db:"to_date"`
	MigratedAt  time.Time      `json:"migrated_at" db:"migrated_at"`
}

// WeeklyTodos represents todos organized by day for the 7-day view
type WeeklyTodos struct {
	Date  string `json:"date"`
	Day   string `json:"day"`
	Todos []Todo `json:"todos"`
}

// CreateTodoRequest represents the request payload for creating a todo
type CreateTodoRequest struct {
	Title            string `json:"title" binding:"required"`
	CategoryID       *int   `json:"category_id,omitempty"`
	ScheduledDate    string `json:"scheduled_date,omitempty"`
	Color            string `json:"color,omitempty"`
	RecurringPattern string `json:"recurring_pattern,omitempty"`
}

// UpdateTodoRequest represents the request payload for updating a todo
type UpdateTodoRequest struct {
	Title         *string `json:"title,omitempty"`
	Completed     *bool   `json:"completed,omitempty"`
	CategoryID    *int    `json:"category_id,omitempty"`
	ScheduledDate *string `json:"scheduled_date,omitempty"`
	SortOrder     *int    `json:"sort_order,omitempty"`
	Color         *string `json:"color,omitempty"`
}

// CreateCategoryRequest represents the request payload for creating a category
type CreateCategoryRequest struct {
	Name  string `json:"name" binding:"required"`
	Color string `json:"color,omitempty"`
}

// UpdateCategoryRequest represents the request payload for updating a category
type UpdateCategoryRequest struct {
	Name      *string `json:"name,omitempty"`
	Color     *string `json:"color,omitempty"`
	SortOrder *int    `json:"sort_order,omitempty"`
}

// APIResponse represents a standard API response
type APIResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

// DashboardData represents the complete dashboard data
type DashboardData struct {
	WeeklyTodos    []WeeklyTodos `json:"weekly_todos"`
	SomedayTodos   []Todo        `json:"someday_todos"`
	Categories     []Category    `json:"categories"`
	TodayDate      string        `json:"today_date"`
	WeekStartDate  string        `json:"week_start_date"`
}