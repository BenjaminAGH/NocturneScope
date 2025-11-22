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

func (h *AlertHandler) SendTestEmail(c *fiber.Ctx) error {
	var req struct {
		Email string `json:"email"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if req.Email == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Email is required"})
	}

	if err := h.service.SendTestEmail(req.Email); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "Test email sent successfully"})
}

func (h *AlertHandler) GetActiveRules(c *fiber.Ctx) error {
	rules := h.service.GetActiveRules()
	return c.JSON(fiber.Map{
		"active_rules": rules,
		"count":        len(rules),
	})
}
