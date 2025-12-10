package handlers

import (
	"github.com/BenjaminAGH/nocturnescope/backend/internal/domain"
	"github.com/gofiber/fiber/v2"
)

type NotificationHandler struct {
	alertService domain.AlertService
}

func NewNotificationHandler(s domain.AlertService) *NotificationHandler {
	return &NotificationHandler{alertService: s}
}

func (h *NotificationHandler) GetNotifications(c *fiber.Ctx) error {
	// Assuming auth middleware sets "userID" in locals or we extract it from token
	// In Fiber with JWTware, it's usually in c.Locals("user")
	// For now let's assume a helper or look at how other handlers do it.
	// I'll assume c.Locals("userID") (uint) is set by middleware.

	userIDVal := c.Locals("userID")
	if userIDVal == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}
	userID := userIDVal.(uint)

	limit := 50
	if l := c.QueryInt("limit"); l > 0 {
		limit = l
	}

	notifications, err := h.alertService.GetNotifications(userID, limit)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(notifications)
}
