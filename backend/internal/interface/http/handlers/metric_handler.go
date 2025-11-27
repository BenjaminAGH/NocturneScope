package handlers

import (
	"time"

	"github.com/gofiber/fiber/v2"

	"github.com/BenjaminAGH/nocturnescope/backend/internal/domain"
	metricuc "github.com/BenjaminAGH/nocturnescope/backend/internal/usecase/service"
)

type MetricHandler struct {
	svc          *metricuc.MetricService
	tokenService *metricuc.TokenService
}

func NewMetricHandler(svc *metricuc.MetricService, tokenService *metricuc.TokenService) *MetricHandler {
	return &MetricHandler{svc: svc, tokenService: tokenService}
}

func (h *MetricHandler) Create(c *fiber.Ctx) error {
	var body domain.Metric
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "bad request"})
	}

	if body.Timestamp.IsZero() {
		body.Timestamp = time.Now().UTC()
	}

	if err := h.svc.Store(body); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	// Auto-update device name if hostname is provided and differs
	if body.Hostname != "" {
		if tokenAny := c.Locals("token"); tokenAny != nil {
			if token, ok := tokenAny.(*domain.APIToken); ok {
				if token.DeviceName != body.Hostname {
					// Update token device name
					if err := h.tokenService.UpdateDeviceName(token.ID, body.Hostname); err != nil {
						// Log error but don't fail request
						// fmt.Printf("Failed to update device name: %v\n", err)
					}
				}
			}
		}
	}

	return c.Status(201).JSON(fiber.Map{"message": "metric stored"})
}
