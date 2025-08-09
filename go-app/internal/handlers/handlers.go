package handlers

import (
	"database/sql"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"teuxdeux-clone/internal/database"
	"teuxdeux-clone/internal/models"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	db *database.DB
}

func NewHandler(db *database.DB) *Handler {
	return &Handler{db: db}
}

// GetDashboard returns the main dashboard data with 7-day view and someday todos
func (h *Handler) GetDashboard(c *gin.Context) {
	// Get week offset parameter (default 0 for current week)
	weekOffsetStr := c.DefaultQuery("weekOffset", "0")
	weekOffset, err := strconv.Atoi(weekOffsetStr)
	if err != nil {
		weekOffset = 0
	}
	
	// Get today's date and calculate start date based on offset
	today := time.Now().Format("2006-01-02")
	startDate := time.Now().AddDate(0, 0, weekOffset)
	
	// Calculate week dates (7 days starting from offset date)
	weeklyTodos := make([]models.WeeklyTodos, 7)
	for i := 0; i < 7; i++ {
		date := startDate.AddDate(0, 0, i)
		dayStr := date.Format("2006-01-02")
		dayName := date.Format("Monday")
		
		// Get todos for this day
		todos, err := h.getTodosForDate(dayStr)
		if err != nil {
			c.JSON(http.StatusInternalServerError, models.APIResponse{
				Success: false,
				Error:   fmt.Sprintf("Failed to get todos for %s: %v", dayStr, err),
			})
			return
		}
		
		weeklyTodos[i] = models.WeeklyTodos{
			Date:  dayStr,
			Day:   dayName,
			Todos: todos,
		}
	}
	
	// Get someday todos (todos without scheduled_date)
	somedayTodos, err := h.getSomedayTodos()
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   fmt.Sprintf("Failed to get someday todos: %v", err),
		})
		return
	}
	
	// Get categories
	categories, err := h.getCategories()
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   fmt.Sprintf("Failed to get categories: %v", err),
		})
		return
	}
	
	dashboardData := models.DashboardData{
		WeeklyTodos:   weeklyTodos,
		SomedayTodos:  somedayTodos,
		Categories:    categories,
		TodayDate:     today,
		WeekStartDate: startDate.Format("2006-01-02"),
	}
	
	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data:    dashboardData,
	})
}

// CreateTodo creates a new todo
func (h *Handler) CreateTodo(c *gin.Context) {
	var req models.CreateTodoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   "Invalid request body: " + err.Error(),
		})
		return
	}
	
	// Prepare query
	query := `
		INSERT INTO todos (title, category_id, scheduled_date, color, recurring_pattern)
		VALUES (?, ?, ?, ?, ?)
	`
	
	result, err := h.db.Exec(query, req.Title, req.CategoryID, 
		nullString(req.ScheduledDate), nullString(req.Color), nullString(req.RecurringPattern))
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Failed to create todo: " + err.Error(),
		})
		return
	}
	
	todoID, _ := result.LastInsertId()
	
	c.JSON(http.StatusCreated, models.APIResponse{
		Success: true,
		Message: "Todo created successfully",
		Data:    map[string]interface{}{"id": todoID},
	})
}

// UpdateTodo updates an existing todo
func (h *Handler) UpdateTodo(c *gin.Context) {
	todoID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   "Invalid todo ID",
		})
		return
	}
	
	var req models.UpdateTodoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   "Invalid request body: " + err.Error(),
		})
		return
	}
	
	// Build dynamic update query
	setParts := []string{}
	args := []interface{}{}
	
	if req.Title != nil {
		setParts = append(setParts, "title = ?")
		args = append(args, *req.Title)
	}
	if req.Completed != nil {
		setParts = append(setParts, "completed = ?")
		args = append(args, *req.Completed)
	}
	if req.CategoryID != nil {
		setParts = append(setParts, "category_id = ?")
		args = append(args, *req.CategoryID)
	}
	if req.ScheduledDate != nil {
		setParts = append(setParts, "scheduled_date = ?")
		args = append(args, nullString(*req.ScheduledDate))
	}
	if req.SortOrder != nil {
		setParts = append(setParts, "sort_order = ?")
		args = append(args, *req.SortOrder)
	}
	if req.Color != nil {
		setParts = append(setParts, "color = ?")
		args = append(args, nullString(*req.Color))
	}
	
	if len(setParts) == 0 {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   "No fields to update",
		})
		return
	}
	
	query := "UPDATE todos SET " + setParts[0]
	for i := 1; i < len(setParts); i++ {
		query += ", " + setParts[i]
	}
	query += " WHERE id = ?"
	args = append(args, todoID)
	
	_, err = h.db.Exec(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Failed to update todo: " + err.Error(),
		})
		return
	}
	
	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Todo updated successfully",
	})
}

// DeleteTodo deletes a todo
func (h *Handler) DeleteTodo(c *gin.Context) {
	todoID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   "Invalid todo ID",
		})
		return
	}
	
	_, err = h.db.Exec("DELETE FROM todos WHERE id = ?", todoID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Failed to delete todo: " + err.Error(),
		})
		return
	}
	
	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Todo deleted successfully",
	})
}

// MigratePastTodos migrates incomplete todos from past dates to today
func (h *Handler) MigratePastTodos(c *gin.Context) {
	today := time.Now().Format("2006-01-02")
	
	// Get all incomplete todos from past dates
	query := `
		SELECT id, title, scheduled_date FROM todos 
		WHERE completed = false 
		AND scheduled_date IS NOT NULL 
		AND scheduled_date < ?
	`
	
	rows, err := h.db.Query(query, today)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Failed to query past todos: " + err.Error(),
		})
		return
	}
	defer rows.Close()
	
	migratedCount := 0
	for rows.Next() {
		var todoID int
		var title string
		var oldDate string
		
		if err := rows.Scan(&todoID, &title, &oldDate); err != nil {
			continue
		}
		
		// Log the migration
		_, err = h.db.Exec(`
			INSERT INTO todo_migrations (todo_id, from_date, to_date) 
			VALUES (?, ?, ?)
		`, todoID, oldDate, today)
		if err != nil {
			continue
		}
		
		// Update todo to today
		_, err = h.db.Exec(`
			UPDATE todos SET scheduled_date = ? WHERE id = ?
		`, today, todoID)
		if err != nil {
			continue
		}
		
		migratedCount++
	}
	
	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: fmt.Sprintf("Migrated %d todos to today", migratedCount),
		Data:    map[string]interface{}{"migrated_count": migratedCount},
	})
}

// Helper functions
func (h *Handler) getTodosForDate(date string) ([]models.Todo, error) {
	query := `
		SELECT t.id, t.title, t.completed, t.category_id, c.name as category_name, 
			   c.color as category_color, t.scheduled_date, t.sort_order, 
			   t.color, t.recurring_pattern, t.parent_id, t.created_at, t.updated_at
		FROM todos t
		LEFT JOIN categories c ON t.category_id = c.id
		WHERE t.scheduled_date = ?
		ORDER BY t.sort_order ASC, t.created_at ASC
	`
	
	rows, err := h.db.Query(query, date)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	
	var todos []models.Todo
	for rows.Next() {
		var todo models.Todo
		var categoryName sql.NullString
		var categoryColor sql.NullString
		
		err := rows.Scan(&todo.ID, &todo.Title, &todo.Completed, &todo.CategoryID,
			&categoryName, &categoryColor, &todo.ScheduledDate,
			&todo.SortOrder, &todo.Color, &todo.RecurringPattern, &todo.ParentID,
			&todo.CreatedAt, &todo.UpdatedAt)
		if err != nil {
			continue
		}
		
		// Handle NULL category values
		if categoryName.Valid {
			todo.CategoryName = categoryName.String
		}
		if categoryColor.Valid {
			todo.CategoryColor = categoryColor.String
		}
		
		todos = append(todos, todo)
	}
	
	return todos, nil
}

func (h *Handler) getSomedayTodos() ([]models.Todo, error) {
	query := `
		SELECT t.id, t.title, t.completed, t.category_id, c.name as category_name,
			   c.color as category_color, t.scheduled_date, t.sort_order,
			   t.color, t.recurring_pattern, t.parent_id, t.created_at, t.updated_at
		FROM todos t
		LEFT JOIN categories c ON t.category_id = c.id
		WHERE t.scheduled_date IS NULL
		ORDER BY t.category_id ASC, t.sort_order ASC, t.created_at ASC
	`
	
	rows, err := h.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	
	var todos []models.Todo
	for rows.Next() {
		var todo models.Todo
		var categoryName sql.NullString
		var categoryColor sql.NullString
		
		err := rows.Scan(&todo.ID, &todo.Title, &todo.Completed, &todo.CategoryID,
			&categoryName, &categoryColor, &todo.ScheduledDate,
			&todo.SortOrder, &todo.Color, &todo.RecurringPattern, &todo.ParentID,
			&todo.CreatedAt, &todo.UpdatedAt)
		if err != nil {
			continue
		}
		
		// Handle NULL category values
		if categoryName.Valid {
			todo.CategoryName = categoryName.String
		}
		if categoryColor.Valid {
			todo.CategoryColor = categoryColor.String
		}
		
		todos = append(todos, todo)
	}
	
	return todos, nil
}

func (h *Handler) getCategories() ([]models.Category, error) {
	query := `
		SELECT id, name, color, sort_order, created_at, updated_at
		FROM categories
		ORDER BY sort_order ASC, name ASC
	`
	
	rows, err := h.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	
	var categories []models.Category
	for rows.Next() {
		var cat models.Category
		err := rows.Scan(&cat.ID, &cat.Name, &cat.Color, &cat.SortOrder,
			&cat.CreatedAt, &cat.UpdatedAt)
		if err != nil {
			continue
		}
		categories = append(categories, cat)
	}
	
	return categories, nil
}

// nullString returns sql.NullString for empty strings
func nullString(s string) interface{} {
	if s == "" {
		return nil
	}
	return s
}