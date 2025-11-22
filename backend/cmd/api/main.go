package main

import (
	"fmt"
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/joho/godotenv"

	"github.com/BenjaminAGH/nocturnescope/backend/internal/infrastructure/database"
	"github.com/BenjaminAGH/nocturnescope/backend/internal/infrastructure/repository"
	"github.com/BenjaminAGH/nocturnescope/backend/internal/infrastructure/security"
	"github.com/BenjaminAGH/nocturnescope/backend/internal/infrastructure/session"
	httpRoutes "github.com/BenjaminAGH/nocturnescope/backend/internal/interface/http/routes"
	"github.com/BenjaminAGH/nocturnescope/backend/internal/usecase/service"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func main() {
	_ = godotenv.Load("config/.env")

	db := database.Connect()
	influxWriter := database.NewInfluxFromEnv()

	// repos
	userRepo := repository.NewUserGormRepository(db)
	apiTokenRepo := repository.NewAPITokenGormRepository(db)
	topologyRepo := repository.NewTopologyGormRepository(db)

	// servicios
	userService := service.NewUserService(userRepo)

	jwtService := security.NewJWTServiceFromEnv()
	sessionStore := session.NewMemoryStore()
	authService := service.NewAuthService(userRepo, jwtService, sessionStore)

	alertService := service.NewAlertService()
	metricService := service.NewMetricService(influxWriter, alertService)
	apiTokenService := service.NewTokenService(apiTokenRepo)
	topologyService := service.NewTopologyService(topologyRepo, alertService)

	app := fiber.New()

	origins := os.Getenv("CORS_ALLOWED_ORIGINS")
	if origins == "" {
		origins = "http://localhost:3000"
	}

	app.Use(cors.New(cors.Config{
		AllowOrigins:     origins,
		AllowMethods:     "GET,POST,PUT,PATCH,DELETE,OPTIONS",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowCredentials: true,
	}))

	app.Get("/", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "ok",
			"service": "nocturnescope-api",
		})
	})

	// Load alert rules from existing topologies
	if err := topologyService.LoadRules(); err != nil {
		fmt.Printf("Error loading alert rules: %v\n", err)
	}

	httpRoutes.Register(app, userService, authService, jwtService, metricService, apiTokenService, topologyService, alertService)

	log.Fatal(app.Listen(":3000"))
}
