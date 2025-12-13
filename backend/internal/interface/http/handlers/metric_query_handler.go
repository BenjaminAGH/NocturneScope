package handlers

import (
	"context"

	"github.com/gofiber/fiber/v2"

	"github.com/BenjaminAGH/nocturnescope/backend/internal/domain"
	"github.com/BenjaminAGH/nocturnescope/backend/internal/usecase/service"
)

type MetricQueryHandler struct {
	svc           *service.MetricService
	tokenRepo     domain.APITokenRepository
	deviceService *service.DeviceService
}

func NewMetricQueryHandler(s *service.MetricService, tokenRepo domain.APITokenRepository, deviceService *service.DeviceService) *MetricQueryHandler {
	return &MetricQueryHandler{
		svc:           s,
		tokenRepo:     tokenRepo,
		deviceService: deviceService,
	}
}

func (h *MetricQueryHandler) Devices(c *fiber.Ctx) error {
	// Get user ID from JWT middleware
	userIDAny := c.Locals("user_id")
	if userIDAny == nil {
		return c.Status(401).JSON(fiber.Map{"error": "unauthorized"})
	}

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
		// Get all devices from DeviceService (PostgreSQL)
		// This ensures we list devices that have been seen, and respects deletions.
		// We map domain.Device to string names for compatibility.
		devs, e := h.deviceService.List()
		if e != nil {
			err = e
		} else {
			for _, d := range devs {
				devices = append(devices, d.Name)
			}
		}
	}

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(devices)
}

func (h *MetricQueryHandler) DeleteDevice(c *fiber.Ctx) error {
	name := c.Params("name")
	if name == "" {
		return c.Status(400).JSON(fiber.Map{"error": "name required"})
	}

	if err := h.deviceService.Delete(name); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.SendStatus(204)
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
	startVal := c.Query("start", "")
	stopVal := c.Query("stop", "")
	interval := c.Query("interval", "1m")
	agg := c.Query("agg", "mean")

	points, err := h.svc.TimeSeries(context.Background(), device, field, rangeDur, startVal, stopVal, agg, interval)
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
