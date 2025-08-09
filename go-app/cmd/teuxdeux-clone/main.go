package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"teuxdeux-clone/internal/database"
	"teuxdeux-clone/internal/handlers"

	"github.com/gin-gonic/gin"
)

func main() {
	// Initialize database
	db, err := database.Initialize("./teuxdeux.db")
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer db.Close()

	// Run initial migration of past todos
	runInitialMigration(db)

	// Initialize handlers
	handler := handlers.NewHandler(db)

	// Set gin mode
	if os.Getenv("GIN_MODE") == "" {
		gin.SetMode(gin.ReleaseMode)
	}

	// Initialize router
	router := gin.Default()

	// Serve static files
	router.Static("/static", "./static")
	router.LoadHTMLGlob("templates/*")

	// Configure CORS
	router.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")
		
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		
		c.Next()
	})

	// Web routes
	router.GET("/", func(c *gin.Context) {
		c.HTML(http.StatusOK, "index.html", gin.H{
			"title": "TeuxDeux Clone",
		})
	})

	// API routes
	api := router.Group("/api/v1")
	{
		// Dashboard
		api.GET("/dashboard", handler.GetDashboard)
		
		// Todos
		api.POST("/todos", handler.CreateTodo)
		api.PUT("/todos/:id", handler.UpdateTodo)
		api.DELETE("/todos/:id", handler.DeleteTodo)
		api.POST("/todos/migrate", handler.MigratePastTodos)
		
		// Categories
		api.GET("/categories", handler.GetCategories)
		api.POST("/categories", handler.CreateCategory)
		api.PUT("/categories/:id", handler.UpdateCategory)
		api.DELETE("/categories/:id", handler.DeleteCategory)
		
		// Health check
		api.GET("/health", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"status": "healthy",
				"timestamp": time.Now(),
			})
		})
	}

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Starting TeuxDeux Clone server on port %s", port)
	log.Printf("Visit http://localhost:%s to use the application", port)
	
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

func runInitialMigration(db *database.DB) {
	today := time.Now().Format("2006-01-02")
	
	// Get incomplete todos from past dates
	query := `
		SELECT COUNT(*) FROM todos 
		WHERE completed = false 
		AND scheduled_date IS NOT NULL 
		AND scheduled_date < ?
	`
	
	var count int
	err := db.QueryRow(query, today).Scan(&count)
	if err != nil {
		log.Printf("Failed to check for past todos: %v", err)
		return
	}
	
	if count > 0 {
		log.Printf("Found %d incomplete todos from past dates, migrating to today...", count)
		
		// Migrate them
		updateQuery := `
			UPDATE todos 
			SET scheduled_date = ? 
			WHERE completed = false 
			AND scheduled_date IS NOT NULL 
			AND scheduled_date < ?
		`
		
		_, err = db.Exec(updateQuery, today, today)
		if err != nil {
			log.Printf("Failed to migrate past todos: %v", err)
			return
		}
		
		log.Printf("Successfully migrated %d todos to today", count)
	}
}