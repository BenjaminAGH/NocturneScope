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
	userIDAny := c.Locals("user_id")
	if userIDAny == nil {
		return c.Status(401).JSON(fiber.Map{"error": "unauthorized"})
	}

	// Convert to uint (handles both uint and float64 from JWT claims)
	// Convert to uint (handles both uint and float64 from JWT claims)
	// var userID uint
	// switch v := userIDAny.(type) {
	// case uint:
	// 	userID = v
	// case float64:
	// 	userID = uint(v)
	// default:
	// 	return c.Status(401).JSON(fiber.Map{"error": "invalid user_id type"})
	// }

	// Check for group_id query param
	groupID := c.QueryInt("group_id", 0)

	var devices []string
	var err error

	if groupID > 0 {
		// Get devices for specific group
		// Note: We should verify the group belongs to the user, but for now
		// we rely on the fact that tokens are associated with groups and users.
		// A more robust check would be to verify group ownership first.
		devices, err = h.tokenRepo.GetDeviceNamesByGroup(uint(groupID))
	} else {
		// Get all devices from InfluxDB (active devices)
		// This allows seeing devices that don't have a token yet
		devices, err = h.svc.ListDevices(c.Context())
	}

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
