package repository

import (
	"context"
	"crypto/rand"
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/carmezini/rotta/internal/models"
)

// ErrNotFound é retornado quando um recurso não é encontrado
var ErrNotFound = errors.New("resource not found")

// InMemoryGoalRepository implementa GoalRepository em memória
type InMemoryGoalRepository struct {
	mu    sync.RWMutex
	goals map[string]*models.Goal
}

// NewInMemoryGoalRepository cria uma nova instância do repositório em memória
func NewInMemoryGoalRepository() *InMemoryGoalRepository {
	return &InMemoryGoalRepository{
		goals: make(map[string]*models.Goal),
	}
}

func (r *InMemoryGoalRepository) Create(ctx context.Context, goal *models.Goal) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if goal.ID == "" {
		goal.ID = generateUUID()
	}
	now := time.Now()
	goal.CreatedAt = now
	goal.UpdatedAt = now

	r.goals[goal.ID] = goal
	return nil
}

func (r *InMemoryGoalRepository) GetByID(ctx context.Context, id string) (*models.Goal, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	goal, exists := r.goals[id]
	if !exists {
		return nil, ErrNotFound
	}

	// Retorna uma cópia para evitar modificações externas acidentais
	copyGoal := *goal
	return &copyGoal, nil
}

func (r *InMemoryGoalRepository) ListByUserID(ctx context.Context, userID string) ([]*models.Goal, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var result []*models.Goal
	for _, goal := range r.goals {
		if goal.UserID == userID {
			copyGoal := *goal
			result = append(result, &copyGoal)
		}
	}
	return result, nil
}

func (r *InMemoryGoalRepository) Update(ctx context.Context, goal *models.Goal) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	existing, exists := r.goals[goal.ID]
	if !exists {
		return ErrNotFound
	}

	goal.UpdatedAt = time.Now()
	goal.CreatedAt = existing.CreatedAt // Preserva a data de criação

	r.goals[goal.ID] = goal
	return nil
}

func (r *InMemoryGoalRepository) Delete(ctx context.Context, id string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, exists := r.goals[id]; !exists {
		return ErrNotFound
	}

	delete(r.goals, id)
	return nil
}

// InMemoryCheckInRepository implementa CheckInRepository em memória
type InMemoryCheckInRepository struct {
	mu       sync.RWMutex
	checkins map[string][]*models.CheckIn
}

// NewInMemoryCheckInRepository cria uma nova instância do repositório em memória
func NewInMemoryCheckInRepository() *InMemoryCheckInRepository {
	return &InMemoryCheckInRepository{
		checkins: make(map[string][]*models.CheckIn),
	}
}

func (r *InMemoryCheckInRepository) Create(ctx context.Context, checkin *models.CheckIn) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if checkin.ID == "" {
		checkin.ID = generateUUID()
	}
	if checkin.CreatedAt.IsZero() {
		checkin.CreatedAt = time.Now()
	}

	r.checkins[checkin.GoalID] = append(r.checkins[checkin.GoalID], checkin)
	return nil
}

func (r *InMemoryCheckInRepository) ListByGoalID(ctx context.Context, goalID string) ([]*models.CheckIn, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	checkins, exists := r.checkins[goalID]
	if !exists {
		return []*models.CheckIn{}, nil
	}

	// Retorna uma cópia
	result := make([]*models.CheckIn, len(checkins))
	for i, c := range checkins {
		copyC := *c
		result[i] = &copyC
	}
	return result, nil
}

// Helper para gerar um pseudo-UUID v4 simples sem dependências externas
func generateUUID() string {
	b := make([]byte, 16)
	_, err := rand.Read(b)
	if err != nil {
		// Fallback caso falte entropia no sistema
		return fmt.Sprintf("%d", time.Now().UnixNano())
	}
	return fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:])
}
