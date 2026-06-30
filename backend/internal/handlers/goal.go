package handlers

import (
	"net/http"
	"time"

	"github.com/carmezini/rotta/internal/models"
	"github.com/carmezini/rotta/internal/repository"

	"github.com/gin-gonic/gin"
)

// GoalHandler gerencia as requisições HTTP para Metas
type GoalHandler struct {
	goalRepo repository.GoalRepository
}

// NewGoalHandler cria uma nova instância de GoalHandler
func NewGoalHandler(goalRepo repository.GoalRepository) *GoalHandler {
	return &GoalHandler{
		goalRepo: goalRepo,
	}
}

// Create cria uma nova meta para o usuário
func (h *GoalHandler) Create(c *gin.Context) {
	var req models.CreateGoalRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	goal := &models.Goal{
		UserID:       req.UserID,
		Name:         req.Name,
		Description:  req.Description,
		Type:         req.Type,
		TargetValue:  req.TargetValue,
		CurrentValue: 0, // Começa em 0
		Period:       req.Period,
		StartDate:    time.Now(),
		EndDate:      req.EndDate,
	}

	err := h.goalRepo.Create(c.Request.Context(), goal)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "erro ao criar meta: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, goal)
}

// GetByID busca os detalhes de uma meta específica
func (h *GoalHandler) GetByID(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id é obrigatório"})
		return
	}

	goal, err := h.goalRepo.GetByID(c.Request.Context(), id)
	if err != nil {
		if err == repository.ErrNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "meta não encontrada"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, goal)
}

// List lista todas as metas de um usuário
func (h *GoalHandler) List(c *gin.Context) {
	// Em produção, o userID viria do middleware de autenticação (JWT do Supabase)
	// Para testes rápidos, pegamos via Query Parameter (?user_id=123)
	userID := c.Query("user_id")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "parâmetro user_id é obrigatório"})
		return
	}

	goals, err := h.goalRepo.ListByUserID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, goals)
}

// Update atualiza os campos de uma meta
func (h *GoalHandler) Update(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id é obrigatório"})
		return
	}

	var req models.UpdateGoalRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Busca a meta atual
	goal, err := h.goalRepo.GetByID(c.Request.Context(), id)
	if err != nil {
		if err == repository.ErrNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "meta não encontrada"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Atualiza apenas os campos fornecidos
	if req.Name != nil {
		goal.Name = *req.Name
	}
	if req.Description != nil {
		goal.Description = *req.Description
	}
	if req.TargetValue != nil {
		goal.TargetValue = *req.TargetValue
	}
	if req.Period != nil {
		goal.Period = *req.Period
	}
	if req.EndDate != nil {
		goal.EndDate = req.EndDate
	}

	err = h.goalRepo.Update(c.Request.Context(), goal)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, goal)
}

// Delete remove uma meta
func (h *GoalHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id é obrigatório"})
		return
	}

	err := h.goalRepo.Delete(c.Request.Context(), id)
	if err != nil {
		if err == repository.ErrNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "meta não encontrada"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "meta removida com sucesso"})
}
