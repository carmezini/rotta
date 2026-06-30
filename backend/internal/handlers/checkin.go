package handlers

import (
	"net/http"
	"time"

	"github.com/carmezini/rotta/internal/models"
	"github.com/carmezini/rotta/internal/repository"

	"github.com/gin-gonic/gin"
)

// CheckInHandler gerencia as requisições HTTP para Check-ins
type CheckInHandler struct {
	checkInRepo repository.CheckInRepository
	goalRepo    repository.GoalRepository
}

// NewCheckInHandler cria uma nova instância de CheckInHandler
func NewCheckInHandler(checkInRepo repository.CheckInRepository, goalRepo repository.GoalRepository) *CheckInHandler {
	return &CheckInHandler{
		checkInRepo: checkInRepo,
		goalRepo:    goalRepo,
	}
}

// Create registra um novo progresso em uma meta
func (h *CheckInHandler) Create(c *gin.Context) {
	goalID := c.Param("id")
	if goalID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id da meta é obrigatório"})
		return
	}

	var req models.CreateCheckInRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 1. Verifica se a meta existe
	goal, err := h.goalRepo.GetByID(c.Request.Context(), goalID)
	if err != nil {
		if err == repository.ErrNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "meta não encontrada"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 2. Prepara o registro de check-in
	timestamp := time.Now()
	if req.Timestamp != nil {
		timestamp = *req.Timestamp
	}

	checkin := &models.CheckIn{
		GoalID:    goalID,
		Value:     req.Value,
		Notes:     req.Notes,
		Timestamp: timestamp,
	}

	// 3. Salva o check-in no banco
	err = h.checkInRepo.Create(c.Request.Context(), checkin)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "erro ao registrar check-in: " + err.Error()})
		return
	}

	// 4. Atualiza o progresso (CurrentValue) na meta correspondente
	// Nota: Em um sistema de produção com concorrência pesada, 
	// isso pode ser feito via triggers no banco de dados ou calculando dinamicamente.
	// Para este esqueleto, atualizamos diretamente o valor na meta.
	
	if goal.Type == models.GoalTypeStreak {
		// Para metas de streak (consecutivos), a lógica pode ser mais avançada.
		// Aqui apenas incrementamos 1 por padrão para indicar progresso,
		// ou o usuário pode enviar o valor desejado.
		goal.CurrentValue += req.Value
	} else {
		// Para limites (limit) e acumuladores (accumulate), somamos o valor do check-in
		goal.CurrentValue += req.Value
	}

	err = h.goalRepo.Update(c.Request.Context(), goal)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "erro ao atualizar progresso da meta: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"checkin":       checkin,
		"current_value": goal.CurrentValue,
		"target_value":  goal.TargetValue,
		"is_exceeded":   goal.Type == models.GoalTypeLimit && goal.CurrentValue > goal.TargetValue,
	})
}

// List lista todos os check-ins de uma meta específica
func (h *CheckInHandler) List(c *gin.Context) {
	goalID := c.Param("id")
	if goalID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id da meta é obrigatório"})
		return
	}

	// Verifica se a meta existe antes de listar check-ins
	_, err := h.goalRepo.GetByID(c.Request.Context(), goalID)
	if err != nil {
		if err == repository.ErrNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "meta não encontrada"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	checkins, err := h.checkInRepo.ListByGoalID(c.Request.Context(), goalID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, checkins)
}