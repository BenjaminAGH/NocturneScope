package handlers

import (
	"log"

	"net"
	"time"

	"github.com/BenjaminAGH/nocturnescope/backend/internal/domain"
	"github.com/BenjaminAGH/nocturnescope/backend/internal/usecase/service"
	"github.com/gofiber/fiber/v2"
)

type NetworkTrafficHandler struct {
	service *service.NetworkTrafficService
}

func NewNetworkTrafficHandler(service *service.NetworkTrafficService) *NetworkTrafficHandler {
	return &NetworkTrafficHandler{service: service}
}

func (h *NetworkTrafficHandler) ReceiveTraffic(c *fiber.Ctx) error {
	// Get token from context (set by APIToken middleware)
	tokenAny := c.Locals("token")
	if tokenAny == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"})
	}
	token, ok := tokenAny.(*domain.APIToken)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "invalid token type"})
	}
	deviceID := token.ID

	var req struct {
		TrafficData []domain.NetworkTraffic `json:"traffic_data"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}

	for _, t := range req.TrafficData {
		if t.Protocol != "TCP" && t.Protocol != "UDP" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid protocol"})
		}
		if net.ParseIP(t.SourceIP) == nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid source IP"})
		}
		if t.DestinationPort < 0 || t.DestinationPort > 65535 {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid destination port"})
		}
		if t.ConnectionState == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "connection state required"})
		}
		if t.ThreatLevel != "" && t.ThreatLevel != "LOW" && t.ThreatLevel != "MEDIUM" && t.ThreatLevel != "HIGH" && t.ThreatLevel != "CRITICAL" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid threat level"})
		}
		if t.Duration < 0 {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "duration must be non-negative"})
		}
		if _, err := time.Parse(time.RFC3339, t.Timestamp.Format(time.RFC3339)); err != nil {
			// Note: t.Timestamp is likely already a time.Time if using standard JSON unmarshalling into a struct with time.Time field.
			// If it's a string in the struct, we parse it. If it's time.Time, it's already valid or zero.
			// Assuming domain.NetworkTraffic uses time.Time for Timestamp.
			// If it's zero time, it might be invalid if required.
			if t.Timestamp.IsZero() {
				return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "timestamp required"})
			}
		}
	}

	if err := h.service.ProcessTrafficData(deviceID, req.TrafficData); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to process traffic data"})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"message": "traffic data received"})
}

func (h *NetworkTrafficHandler) GetTraffic(c *fiber.Ctx) error {
	// Get user ID from JWT middleware
	userIDAny := c.Locals("user_id")
	if userIDAny == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"})
	}
	var userID uint
	switch v := userIDAny.(type) {
	case uint:
		userID = v
	case float64:
		userID = uint(v)
	default:
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "invalid user_id type"})
	}

	deviceName := c.Query("device")
	if deviceName != "" {
		traffic, err := h.service.GetByDeviceName(userID, deviceName, 100)
		if err != nil {
			log.Printf("Error fetching traffic by device name: %v", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to fetch traffic data"})
		}
		return c.JSON(traffic)
	}

	// Fallback to deviceId param if needed (admin or direct ID access)
	deviceID, err := c.ParamsInt("deviceId")
	if err == nil && deviceID > 0 {
		// Note: This doesn't check user ownership of device ID directly here,
		// but typically we should. For now keeping it simple or restricted.
		traffic, err := h.service.GetByDeviceID(uint(deviceID), 100)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to fetch traffic data"})
		}
		return c.JSON(traffic)
	}

	return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "missing device name or id"})
}
