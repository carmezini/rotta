package models

import (
	"time"
)

// CheckIn representa o registro de progresso ou evento de uma meta
type CheckIn struct {
	ID        string    `json:"id"`
	GoalID    string    `json:"goal_id"`
	Value     float64   `json:"value"` // O valor adicionado (ex: 1 para ocorrência, 50.50 para dinheiro)
	Notes     string    `json:"notes"` // Observações (ex: "Almoço no restaurante X", "Sobrou da mesada")
	Timestamp time.Time `json:"timestamp"`
	CreatedAt time.Time `json:"created_at"`
}

// CreateCheckInRequest representa o payload para registrar um novo progresso
type CreateCheckInRequest struct {
	Value     float64    `json:"value" binding:"required"`
	Notes     string     `json:"notes"`
	Timestamp *time.Time `json:"timestamp"` // Opcional, se nulo assume o tempo atual
}
