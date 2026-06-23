package handlers

import (
	"net/http"

	"github.com/carmezini/rotta/internal/models"

	"github.com/gin-gonic/gin"
)

func HandleCheckIn(c *gin.Context) {
	var req models.CheckInRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Check-in processado na nova estrutura",
		"user_id": req.UserID,
	})
}