package config

import (
	"database/sql"
	"fmt"
	"os"

	// Driver do PostgreSQL (registra o driver "postgres" no database/sql)
	_ "github.com/lib/pq"
)

// DBConfig armazena as configurações de conexão com o banco de dados
type DBConfig struct {
	ConnString string
}

// LoadConfig carrega as configurações a partir de variáveis de ambiente
func LoadConfig() *DBConfig {
	// No Supabase, você receberá uma URI de conexão semelhante a:
	// postgres://postgres:[senha]@[host]:5432/postgres
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		// Valor padrão ou vazio para desenvolvimento local
		dbURL = "postgres://postgres:postgres@localhost:5432/rotta?sslmode=disable"
	}

	return &DBConfig{
		ConnString: dbURL,
	}
}

// ConnectDB tenta estabelecer uma conexão com o PostgreSQL
func ConnectDB(cfg *DBConfig) (*sql.DB, error) {
	// Nota: Esta função só funcionará após importar o driver (ex: github.com/lib/pq)
	// e ter uma instância do PostgreSQL ativa.
	db, err := sql.Open("postgres", cfg.ConnString)
	if err != nil {
		return nil, fmt.Errorf("erro ao abrir conexão com o banco: %w", err)
	}

	// Testa a conexão
	err = db.Ping()
	if err != nil {
		return nil, fmt.Errorf("erro ao pingar o banco de dados: %w", err)
	}

	return db, nil
}