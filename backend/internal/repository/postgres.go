package repository

import (
	"context"
	"database/sql"
	"errors"

	"github.com/carmezini/rotta/internal/models"
)

// PostgresGoalRepository implementa GoalRepository para PostgreSQL (Supabase)
type PostgresGoalRepository struct {
	db *sql.DB
}

// NewPostgresGoalRepository cria uma nova instância do repositório PostgreSQL
func NewPostgresGoalRepository(db *sql.DB) *PostgresGoalRepository {
	return &PostgresGoalRepository{db: db}
}

func (r *PostgresGoalRepository) Create(ctx context.Context, goal *models.Goal) error {
	query := `
		INSERT INTO goals (id, user_id, name, description, type, target_value, current_value, period, start_date, end_date, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
	`
	_, err := r.db.ExecContext(ctx, query,
		goal.ID, goal.UserID, goal.Name, goal.Description, goal.Type,
		goal.TargetValue, goal.CurrentValue, goal.Period, goal.StartDate, goal.EndDate,
	)
	return err
}

func (r *PostgresGoalRepository) GetByID(ctx context.Context, id string) (*models.Goal, error) {
	query := `
		SELECT id, user_id, name, description, type, target_value, current_value, period, start_date, end_date, created_at, updated_at
		FROM goals WHERE id = $1
	`
	row := r.db.QueryRowContext(ctx, query, id)

	var goal models.Goal
	err := row.Scan(
		&goal.ID, &goal.UserID, &goal.Name, &goal.Description, &goal.Type,
		&goal.TargetValue, &goal.CurrentValue, &goal.Period, &goal.StartDate, &goal.EndDate,
		&goal.CreatedAt, &goal.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &goal, nil
}

func (r *PostgresGoalRepository) ListByUserID(ctx context.Context, userID string) ([]*models.Goal, error) {
	query := `
		SELECT id, user_id, name, description, type, target_value, current_value, period, start_date, end_date, created_at, updated_at
		FROM goals WHERE user_id = $1
		ORDER BY created_at DESC
	`
	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var goals []*models.Goal
	for rows.Next() {
		var goal models.Goal
		err := rows.Scan(
			&goal.ID, &goal.UserID, &goal.Name, &goal.Description, &goal.Type,
			&goal.TargetValue, &goal.CurrentValue, &goal.Period, &goal.StartDate, &goal.EndDate,
			&goal.CreatedAt, &goal.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		goals = append(goals, &goal)
	}
	return goals, nil
}

func (r *PostgresGoalRepository) Update(ctx context.Context, goal *models.Goal) error {
	query := `
		UPDATE goals
		SET name = $1, description = $2, target_value = $3, current_value = $4, period = $5, end_date = $6, updated_at = NOW()
		WHERE id = $7
	`
	result, err := r.db.ExecContext(ctx, query,
		goal.Name, goal.Description, goal.TargetValue, goal.CurrentValue, goal.Period, goal.EndDate, goal.ID,
	)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return ErrNotFound
	}

	return nil
}

func (r *PostgresGoalRepository) Delete(ctx context.Context, id string) error {
	query := `DELETE FROM goals WHERE id = $1`
	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return ErrNotFound
	}

	return nil
}

// PostgresCheckInRepository implementa CheckInRepository para PostgreSQL
type PostgresCheckInRepository struct {
	db *sql.DB
}

// NewPostgresCheckInRepository cria uma nova instância do repositório PostgreSQL para check-ins
func NewPostgresCheckInRepository(db *sql.DB) *PostgresCheckInRepository {
	return &PostgresCheckInRepository{db: db}
}

func (r *PostgresCheckInRepository) Create(ctx context.Context, checkin *models.CheckIn) error {
	query := `
		INSERT INTO checkins (id, goal_id, value, notes, timestamp, created_at)
		VALUES ($1, $2, $3, $4, $5, NOW())
	`
	_, err := r.db.ExecContext(ctx, query,
		checkin.ID, checkin.GoalID, checkin.Value, checkin.Notes, checkin.Timestamp,
	)
	return err
}

func (r *PostgresCheckInRepository) ListByGoalID(ctx context.Context, goalID string) ([]*models.CheckIn, error) {
	query := `
		SELECT id, goal_id, value, notes, timestamp, created_at
		FROM checkins WHERE goal_id = $1
		ORDER BY timestamp DESC
	`
	rows, err := r.db.QueryContext(ctx, query, goalID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var checkins []*models.CheckIn
	for rows.Next() {
		var checkin models.CheckIn
		err := rows.Scan(
			&checkin.ID, &checkin.GoalID, &checkin.Value, &checkin.Notes, &checkin.Timestamp, &checkin.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		checkins = append(checkins, &checkin)
	}
	return checkins, nil
}
