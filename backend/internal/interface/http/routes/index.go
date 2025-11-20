package routes

import (
	"github.com/gofiber/fiber/v2"

	"github.com/BenjaminAGH/nocturnescope/backend/internal/infrastructure/security"
	"github.com/BenjaminAGH/nocturnescope/backend/internal/interface/http/handlers"
	"github.com/BenjaminAGH/nocturnescope/backend/internal/interface/http/middleware"
	"github.com/BenjaminAGH/nocturnescope/backend/internal/usecase/service"
)

func Register(
	app *fiber.App,
	userService *service.UserService,
	authService *service.AuthService,
	jwtService *security.JWTService,
	metricService *service.MetricService,
	apiTokenService *service.TokenService,
	topologyService *service.TopologyService,
) {
	api := app.Group("/api")

	// públicas
	RegisterAuthRoutes(api, authService, userService)

	RegisterMetricRoutes(api, metricService, apiTokenService)

	// rutas JWT
	protected := api.Group("")
	protected.Use(middleware.JWTProtected(jwtService, authService))

	authHandler := handlers.NewAuthHandler(authService, userService)
	protected.Post("/auth/logout", authHandler.Logout)

	RegisterMetricQueryRoutes(protected, metricService)

	// api tokens del usuario
	apiTokenHandler := handlers.NewAPITokenHandler(apiTokenService)
	protected.Post("/api-tokens", apiTokenHandler.Create)
	protected.Get("/api-tokens", apiTokenHandler.List)
	protected.Delete("/api-tokens/:id", apiTokenHandler.Delete)

	RegisterUserRoutes(protected, userService)

	// topologías del usuario
	RegisterTopologyRoutes(protected, topologyService)
}
