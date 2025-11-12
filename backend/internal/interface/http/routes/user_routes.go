package routes

import (
	"github.com/BenjaminAGH/nocturnescope/backend/internal/interface/http/handlers"
	"github.com/BenjaminAGH/nocturnescope/backend/internal/interface/http/middleware"
	"github.com/BenjaminAGH/nocturnescope/backend/internal/usecase/service"
	"github.com/gofiber/fiber/v2"
)

func RegisterUserRoutes(api fiber.Router, svc *service.UserService) {
	h := handlers.NewUserHandler(svc)
	users := api.Group("/users")

	users.Get("/", h.List)
	users.Get("/:id", h.Get)

	users.Post("/", middleware.RequireRole("admin"), h.Create)
	users.Patch("/:id", middleware.RequireRole("admin"), h.Update)
	users.Delete("/:id", middleware.RequireRole("admin"), h.Delete)
}
