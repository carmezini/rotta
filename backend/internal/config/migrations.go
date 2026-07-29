package config

import (
	"context"
	"database/sql"
	"embed"
	"fmt"
)

//go:embed migrations/*.sql
var migrations embed.FS

// ApplyMigrations garante que uma instalação nova tenha o esquema mínimo.
// As migrações usam operações idempotentes e podem rodar a cada inicialização.
func ApplyMigrations(ctx context.Context, db *sql.DB) error {
	schema, err := migrations.ReadFile("migrations/001_initial.sql")
	if err != nil {
		return fmt.Errorf("erro ao carregar migração: %w", err)
	}

	if _, err := db.ExecContext(ctx, string(schema)); err != nil {
		return fmt.Errorf("erro ao aplicar migração: %w", err)
	}

	return nil
}
