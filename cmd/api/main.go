package main

import (
	"github.com/carmezini/rotta/internal/handlers"
	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	// Endpoints
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})
	
	// Repare que passamos a função do pacote handlers aqui
	r.POST("/checkin", handlers.HandleCheckIn)

	r.Run(":8080")
}