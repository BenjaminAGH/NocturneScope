package handlers

import (
	"context"

	"github.com/gofiber/fiber/v2"

	"github.com/BenjaminAGH/nocturnescope/backend/internal/domain"
	"github.com/BenjaminAGH/nocturnescope/backend/internal/usecase/service"
)

type MetricQueryHandler struct {
	svc       *service.MetricService
	tokenRepo domain.APITokenRepository
}

func NewMetricQueryHandler(s *service.MetricService, tokenRepo domain.APITokenRepository) *MetricQueryHandler {
	return &MetricQueryHandler{
		svc:       s,
		tokenRepo: tokenRepo,
	}
}

func (h *MetricQueryHandler) Devices(c *fiber.Ctx) error {
	// Get user ID from JWT middleware
	userID, ok := c.Locals("user_id").(uint)
	if !ok {
		return c.Status(401).JSON(fiber.Map{"error": "unauthorized"})
	}

	// Get device names from user's tokens
	devices, err := h.tokenRepo.GetDeviceNamesByUser(userID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(devices)
}

func (h *MetricQueryHandler) Last(c *fiber.Ctx) error {
	device := c.Query("device")
	if device == "" {
		return c.Status(400).JSON(fiber.Map{"error": "missing device"})
	}
	stats, err := h.svc.LastStats(context.Background(), device)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(stats)
}

// GET /api/metrics/timeseries?device=...&field=cpu&range=30m&interval=1m&agg=mean
func (h *MetricQueryHandler) TimeSeries(c *fiber.Ctx) error {
	device := c.Query("device")
	field := c.Query("field")
	if device == "" || field == "" {
		return c.Status(400).JSON(fiber.Map{"error": "missing device or field"})
	}
	rangeDur := c.Query("range", "1h")
	interval := c.Query("interval", "1m")
	agg := c.Query("agg", "mean")

	points, err := h.svc.TimeSeries(context.Background(), device, field, rangeDur, agg, interval)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"points": points})
}

func (h *MetricQueryHandler) History(c *fiber.Ctx) error {
	device := c.Query("device")
	if device == "" {
		return c.Status(400).JSON(fiber.Map{"error": "missing device"})
	}
	rangeDur := c.Query("range", "1h")

	data, err := h.svc.History(context.Background(), device, rangeDur)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(data)
}
