package repository

import (
	"context"

	"github.com/carmezini/rotta/internal/models"
)

// GoalRepository define as operações de banco de dados para Metas
type GoalRepository interface {
	Create(ctx context.Context, goal *models.Goal) error
	GetByID(ctx context.Context, id string) (*models.Goal, error)
	ListByUserID(ctx context.Context, userID string) ([]*models.Goal, error)
	Update(ctx context.Context, goal *models.Goal) error
	Delete(ctx context.Context, id string) error
}

// CheckInRepository define as operações de banco de dados para Check-ins
type CheckInRepository interface {
	Create(ctx context.Context, checkin *models.CheckIn) error
	ListByGoalID(ctx context.Context, goalID string) ([]*models.CheckIn, error)
}
