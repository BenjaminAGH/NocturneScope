package routes

import (
	"github.com/gofiber/fiber/v2"

	"github.com/BenjaminAGH/nocturnescope/backend/internal/domain"
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
	apiTokenRepo domain.APITokenRepository,
	deviceGroupService *service.DeviceGroupService,
	topologyService *service.TopologyService,
	alertService domain.AlertService,
	networkTrafficService *service.NetworkTrafficService,
) {
	api := app.Group("/api")

	// públicas
	RegisterAuthRoutes(api, authService, userService)

	RegisterMetricRoutes(api, metricService, apiTokenService)

	RegisterNetworkTrafficRoutes(api, networkTrafficService, apiTokenService)

	// rutas JWT
	protected := api.Group("")
	protected.Use(middleware.JWTProtected(jwtService, authService))

	authHandler := handlers.NewAuthHandler(authService, userService)
	protected.Post("/auth/logout", authHandler.Logout)

	RegisterMetricQueryRoutes(protected, metricService, apiTokenRepo)
	RegisterNetworkTrafficUserRoutes(protected, networkTrafficService)

	// api tokens del usuario
	apiTokenHandler := handlers.NewAPITokenHandler(apiTokenService, metricService)
	protected.Post("/api-tokens", apiTokenHandler.Create)
	protected.Get("/api-tokens", apiTokenHandler.List)
	protected.Delete("/api-tokens/:id", apiTokenHandler.Delete)

	userHandler := handlers.NewUserHandler(userService)
	protected.Put("/users/me/last-topology", userHandler.UpdateLastTopology)
	protected.Get("/users/me", userHandler.Me)

	RegisterUserRoutes(protected, userService)

	// topologías del usuario
	RegisterTopologyRoutes(protected, topologyService)

	// alertas
	RegisterAlertRoutes(protected, alertService)

	// admin panel (devadmin only)
	RegisterAdminRoutes(protected, userService)

	// device groups
	RegisterDeviceGroupRoutes(protected, deviceGroupService)
}
