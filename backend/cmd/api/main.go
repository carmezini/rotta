package main

import (
	"log"

	"github.com/carmezini/rotta/internal/handlers"
	"github.com/carmezini/rotta/internal/repository"

	"github.com/gin-gonic/gin"
)

// corsMiddleware configura os cabeçalhos do CORS para permitir chamadas do Next.js (frontend)
func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*") // Em produção, altere para a URL do seu frontend Next.js
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
	// 1. Inicializa o roteador Gin
	r := gin.Default()

	// 2. Aplica o Middleware de CORS
	r.Use(corsMiddleware())

	// 3. Inicializa os Repositórios (Em memória para desenvolvimento e testes rápidos)
	// Para alternar para o PostgreSQL/Supabase futuramente, basta inicializar os repositórios correspondentes:
	// db, _ := config.ConnectDB(config.LoadConfig())
	// goalRepo := repository.NewPostgresGoalRepository(db)
	// checkInRepo := repository.NewPostgresCheckInRepository(db)
	
	goalRepo := repository.NewInMemoryGoalRepository()
	checkInRepo := repository.NewInMemoryCheckInRepository()

	// 4. Inicializa os Handlers (Injetando os repositórios)
	goalHandler := handlers.NewGoalHandler(goalRepo)
	checkInHandler := handlers.NewCheckInHandler(checkInRepo, goalRepo)

	// 5. Definição das Rotas da API
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "database": "in_memory"})
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

	log.Println("Servidor rodando na porta :8080...")
	if err := r.Run(":8080"); err != nil {
		log.Fatalf("Falha ao iniciar o servidor: %v", err)
	}
}