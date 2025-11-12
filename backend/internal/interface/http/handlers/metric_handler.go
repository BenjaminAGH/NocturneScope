package handlers

import (
	"time"

	"github.com/gofiber/fiber/v2"

	"github.com/BenjaminAGH/nocturnescope/backend/internal/domain"
	metricuc "github.com/BenjaminAGH/nocturnescope/backend/internal/usecase/service"
)

type MetricHandler struct {
	svc *metricuc.MetricService
}

func NewMetricHandler(svc *metricuc.MetricService) *MetricHandler {
	return &MetricHandler{svc: svc}
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

	return c.Status(201).JSON(fiber.Map{"message": "metric stored"})
}
