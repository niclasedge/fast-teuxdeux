package handlers

import (
	"fmt"
	"net/http"
	"strconv"

	"teuxdeux-clone/internal/models"

	"github.com/gin-gonic/gin"
)

// GetCategories returns all categories
func (h *Handler) GetCategories(c *gin.Context) {
	categories, err := h.getCategories()
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Failed to get categories: " + err.Error(),
		})
		return
	}
	
	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data:    categories,
	})
}

// CreateCategory creates a new category
func (h *Handler) CreateCategory(c *gin.Context) {
	var req models.CreateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   "Invalid request body: " + err.Error(),
		})
		return
	}
	
	// Set default color if not provided
	if req.Color == "" {
		req.Color = "#6b7280" // Default gray color
	}
	
	query := `
		INSERT INTO categories (name, color)
		VALUES (?, ?)
	`
	
	result, err := h.db.Exec(query, req.Name, req.Color)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Failed to create category: " + err.Error(),
		})
		return
	}
	
	categoryID, _ := result.LastInsertId()
	
	c.JSON(http.StatusCreated, models.APIResponse{
		Success: true,
		Message: "Category created successfully",
		Data:    map[string]interface{}{"id": categoryID},
	})
}

// UpdateCategory updates an existing category
func (h *Handler) UpdateCategory(c *gin.Context) {
	categoryID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   "Invalid category ID",
		})
		return
	}
	
	var req models.UpdateCategoryRequest
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
	
	if req.Name != nil {
		setParts = append(setParts, "name = ?")
		args = append(args, *req.Name)
	}
	if req.Color != nil {
		setParts = append(setParts, "color = ?")
		args = append(args, *req.Color)
	}
	if req.SortOrder != nil {
		setParts = append(setParts, "sort_order = ?")
		args = append(args, *req.SortOrder)
	}
	
	if len(setParts) == 0 {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   "No fields to update",
		})
		return
	}
	
	query := "UPDATE categories SET " + setParts[0]
	for i := 1; i < len(setParts); i++ {
		query += ", " + setParts[i]
	}
	query += " WHERE id = ?"
	args = append(args, categoryID)
	
	_, err = h.db.Exec(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Failed to update category: " + err.Error(),
		})
		return
	}
	
	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Category updated successfully",
	})
}

// DeleteCategory deletes a category
func (h *Handler) DeleteCategory(c *gin.Context) {
	categoryID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   "Invalid category ID",
		})
		return
	}
	
	// Check if category is in use
	var count int
	err = h.db.QueryRow("SELECT COUNT(*) FROM todos WHERE category_id = ?", categoryID).Scan(&count)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Failed to check category usage: " + err.Error(),
		})
		return
	}
	
	if count > 0 {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   fmt.Sprintf("Cannot delete category: %d todos are using this category", count),
		})
		return
	}
	
	_, err = h.db.Exec("DELETE FROM categories WHERE id = ?", categoryID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Failed to delete category: " + err.Error(),
		})
		return
	}
	
	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Category deleted successfully",
	})
}