package routes

import (
	"github.com/BenjaminAGH/nocturnescope/backend/internal/interface/http/handlers"
	"github.com/gofiber/fiber/v2"
)

func RegisterNotificationRoutes(router fiber.Router, h *handlers.NotificationHandler) {
	g := router.Group("/notifications")
	// Middleware is applied in index.go

	g.Get("/", h.GetNotifications)
	// g.Put("/:id/read", h.MarkAsRead)
}
