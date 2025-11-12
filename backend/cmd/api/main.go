package main

import (
	"log"

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

	// servicios
	userService := service.NewUserService(userRepo)

	jwtService := security.NewJWTServiceFromEnv()
	sessionStore := session.NewMemoryStore()
	authService := service.NewAuthService(userRepo, jwtService, sessionStore)

	metricService := service.NewMetricService(influxWriter)
	apiTokenService := service.NewTokenService(apiTokenRepo)

	app := fiber.New()

	app.Use(cors.New(cors.Config{
		AllowOrigins:     "http://localhost:3001",
		AllowMethods:     "GET,POST,PUT,PATCH,DELETE,OPTIONS",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowCredentials: true,
	}))

	httpRoutes.Register(app, userService, authService, jwtService, metricService, apiTokenService)

	log.Fatal(app.Listen(":3000"))
}
