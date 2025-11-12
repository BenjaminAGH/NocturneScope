package routes

import (
	"github.com/gofiber/fiber/v2"

	"github.com/BenjaminAGH/nocturnescope/backend/internal/interface/http/handlers"
	"github.com/BenjaminAGH/nocturnescope/backend/internal/usecase/service"
)

func RegisterAuthRoutes(api fiber.Router, authService *service.AuthService, userService *service.UserService) {
	h := handlers.NewAuthHandler(authService, userService)

	api.Post("/auth/register", h.Register)
	api.Post("/auth/login", h.Login)
	api.Post("/auth/refresh", h.Refresh)
}
