package handlers

import (
	"time"

	"github.com/BenjaminAGH/nocturnescope/backend/internal/domain"
	"github.com/gofiber/fiber/v2"
)

type AlertHandler struct {
	service domain.AlertService
}

func NewAlertHandler(service domain.AlertService) *AlertHandler {
	return &AlertHandler{service: service}
}

func (h *AlertHandler) GetRecentAlerts(c *fiber.Ctx) error {
	// Default window 10 seconds
	window := 10 * time.Second

	recent := h.service.GetRecentAlerts(window)

	return c.JSON(fiber.Map{
		"recent_alerts": recent,
	})
}
