package models

import (
	"time"
)

// GoalType representa o tipo da meta
type GoalType string

const (
	GoalTypeLimit      GoalType = "limit"      // Ex: máximo de 3 saídas para comer por semana
	GoalTypeStreak     GoalType = "streak"     // Ex: dias seguidos sem "sair da régua"
	GoalTypeAccumulate GoalType = "accumulate" // Ex: guardar R$ 500
)

// PeriodType representa o período de recorrência da meta
type PeriodType string

const (
	PeriodDaily   PeriodType = "daily"
	PeriodWeekly  PeriodType = "weekly"
	PeriodMonthly PeriodType = "monthly"
	PeriodNone    PeriodType = "none" // Metas sem prazo recorrente fixo
)

// Goal representa uma meta de usuário
type Goal struct {
	ID           string     `json:"id"`
	UserID       string     `json:"user_id"`
	Name         string     `json:"name"`
	Description  string     `json:"description"`
	Type         GoalType   `json:"type"`
	TargetValue  float64    `json:"target_value"`  // O valor objetivo (ex: 3 vezes, R$ 500, etc.)
	CurrentValue float64    `json:"current_value"` // Progresso atual calculado
	Period       PeriodType `json:"period"`
	StartDate    time.Time  `json:"start_date"`
	EndDate      *time.Time `json:"end_date,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

// CreateGoalRequest representa o payload para criação de uma meta
type CreateGoalRequest struct {
	UserID      string     `json:"user_id" binding:"required"`
	Name        string     `json:"name" binding:"required"`
	Description string     `json:"description"`
	Type        GoalType   `json:"type" binding:"required,oneof=limit streak accumulate"`
	TargetValue float64    `json:"target_value" binding:"required"`
	Period      PeriodType `json:"period" binding:"required,oneof=daily weekly monthly none"`
	EndDate     *time.Time `json:"end_date"`
}

// UpdateGoalRequest representa o payload para atualização de uma meta
type UpdateGoalRequest struct {
	Name        *string     `json:"name"`
	Description *string     `json:"description"`
	TargetValue *float64    `json:"target_value"`
	Period      *PeriodType `json:"period"`
	EndDate     *time.Time  `json:"end_date"`
}
