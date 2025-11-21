package routes

import (
	"github.com/BenjaminAGH/nocturnescope/backend/internal/domain"
	"github.com/BenjaminAGH/nocturnescope/backend/internal/interface/http/handlers"
	"github.com/gofiber/fiber/v2"
)

func RegisterAlertRoutes(router fiber.Router, service domain.AlertService) {
	handler := handlers.NewAlertHandler(service)

	router.Get("/alerts/recent", handler.GetRecentAlerts)
}
