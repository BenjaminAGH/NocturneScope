package routes

import (
	"github.com/BenjaminAGH/nocturnescope/backend/internal/interface/http/handlers"
	"github.com/BenjaminAGH/nocturnescope/backend/internal/interface/http/middleware"
	"github.com/BenjaminAGH/nocturnescope/backend/internal/usecase/service"
	"github.com/gofiber/fiber/v2"
)

func RegisterAdminRoutes(api fiber.Router, userService *service.UserService) {
	h := handlers.NewAdminHandler(userService)
	admin := api.Group("/admin")

	// All admin routes require devadmin role
	admin.Use(middleware.RequireRole("devadmin"))

	// User management endpoints
	admin.Get("/users", h.ListAllUsers)
	admin.Post("/users", h.CreateUser)
	admin.Patch("/users/:id", h.UpdateUser)
	admin.Delete("/users/:id", h.DeleteUser)
}
