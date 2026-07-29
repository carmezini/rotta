package main

import (
	"context"
	"log"
	"os"

	"github.com/carmezini/rotta/internal/config"
	"github.com/carmezini/rotta/internal/handlers"
	"github.com/carmezini/rotta/internal/repository"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

// corsMiddleware configura os cabeçalhos do CORS para permitir chamadas do Next.js (frontend)
func corsMiddleware() gin.HandlerFunc {
	allowedOrigin := os.Getenv("FRONTEND_URL")
	if allowedOrigin == "" {
		allowedOrigin = "http://localhost:3000"
	}
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

func main() {
	// 1. Carrega variáveis do .env (só tem efeito localmente; em produção o Render já injeta as vars)
	if err := godotenv.Load(); err != nil {
		log.Println("Arquivo .env não encontrado, usando variáveis de ambiente do sistema")
	}

	// 2. Inicializa o roteador Gin
	r := gin.Default()

	// 3. Aplica o Middleware de CORS
	r.Use(corsMiddleware())

	var goalRepo repository.GoalRepository
	var checkInRepo repository.CheckInRepository
	if os.Getenv("DATABASE_URL") == "" {
		goalRepo = repository.NewInMemoryGoalRepository()
		checkInRepo = repository.NewInMemoryCheckInRepository()
		log.Println("Armazenamento em memória ativo (defina DATABASE_URL para usar PostgreSQL).")
	} else {
		cfg := config.LoadConfig()
		db, err := config.ConnectDB(cfg)
		if err != nil {
			log.Fatalf("Falha ao conectar ao banco de dados: %v", err)
		}
		defer db.Close()
		if err := config.ApplyMigrations(context.Background(), db); err != nil {
			log.Fatalf("Falha ao preparar banco de dados: %v", err)
		}
		goalRepo = repository.NewPostgresGoalRepository(db)
		checkInRepo = repository.NewPostgresCheckInRepository(db)
		log.Println("Conexão com o PostgreSQL estabelecida.")
	}

	// 6. Inicializa os Handlers (Injetando os repositórios)
	goalHandler := handlers.NewGoalHandler(goalRepo)
	checkInHandler := handlers.NewCheckInHandler(checkInRepo, goalRepo)

	// 7. Definição das Rotas da API
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	api := r.Group("/api")
	{
		// Rotas de Metas (Goals)
		api.POST("/goals", goalHandler.Create)
		api.GET("/goals", goalHandler.List)
		api.GET("/goals/:id", goalHandler.GetByID)
		api.PUT("/goals/:id", goalHandler.Update)
		api.DELETE("/goals/:id", goalHandler.Delete)

		// Rotas de Check-ins (Progresso das Metas)
		api.POST("/goals/:id/checkin", checkInHandler.Create)
		api.GET("/goals/:id/checkins", checkInHandler.List)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("Servidor rodando na porta :%s...", port)
	if err := r.Run("0.0.0.0:" + port); err != nil {
		log.Fatalf("Falha ao iniciar o servidor: %v", err)
	}
}
