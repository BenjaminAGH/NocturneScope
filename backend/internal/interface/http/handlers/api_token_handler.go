package handlers

import (
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"

	"github.com/BenjaminAGH/nocturnescope/backend/internal/usecase/service"
)

type APITokenHandler struct {
	svc       *service.TokenService
	metricSvc *service.MetricService
}

func NewAPITokenHandler(svc *service.TokenService, metricSvc *service.MetricService) *APITokenHandler {
	return &APITokenHandler{svc: svc, metricSvc: metricSvc}
}

func (h *APITokenHandler) Create(c *fiber.Ctx) error {
	var body struct {
		Name       string `json:"name"`
		DeviceName string `json:"device_name"`
		GroupID    *uint  `json:"group_id"`
	}
	if err := c.BodyParser(&body); err != nil || body.Name == "" {
		return c.Status(400).JSON(fiber.Map{"error": "name required"})
	}

	uidAny := c.Locals("user_id")
	if uidAny == nil {
		return c.Status(401).JSON(fiber.Map{"error": "unauthorized"})
	}
	uidFloat, ok := uidAny.(float64)
	if !ok {
		return c.Status(401).JSON(fiber.Map{"error": "invalid user id"})
	}
	uid := uint(uidFloat)

	raw, err := h.svc.GenerateForUser(body.Name, body.DeviceName, uid, body.GroupID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(201).JSON(fiber.Map{
		"token": raw,
	})
}

func (h *APITokenHandler) List(c *fiber.Ctx) error {
	uidAny := c.Locals("user_id")
	if uidAny == nil {
		return c.Status(401).JSON(fiber.Map{"error": "unauthorized"})
	}
	uid := uint(uidAny.(float64))

	tokens, err := h.svc.ListByUser(uid)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	type TokenResponse struct {
		ID         uint   `json:"ID"`
		Name       string `json:"Name"`
		TokenHash  string `json:"TokenHash"`
		DeviceName string `json:"DeviceName"`
		GroupID    *uint  `json:"GroupID"`
		CreatedAt  string `json:"CreatedAt"`
		Status     string `json:"Status"` // "online" | "offline"
	}

	var response []TokenResponse
	for _, t := range tokens {
		status := "offline"
		if t.DeviceName != "" {
			stats, err := h.metricSvc.LastStats(c.Context(), t.DeviceName)
			if err == nil && stats != nil {
				if ts, ok := stats["timestamp"].(time.Time); ok {
					if time.Since(ts) < 5*time.Minute {
						status = "online"
					}
				}
			}
		}

		response = append(response, TokenResponse{
			ID:         t.ID,
			Name:       t.Name,
			TokenHash:  t.TokenHash,
			DeviceName: t.DeviceName,
			GroupID:    t.GroupID,
			CreatedAt:  t.CreatedAt.Format(time.RFC3339),
			Status:     status,
		})
	}

	return c.JSON(response)
}

func (h *APITokenHandler) Delete(c *fiber.Ctx) error {
	uidAny := c.Locals("user_id")
	if uidAny == nil {
		return c.Status(401).JSON(fiber.Map{"error": "unauthorized"})
	}
	uid := uint(uidAny.(float64))

	idStr := c.Params("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid id"})
	}

	if err := h.svc.Revoke(uint(id), uid); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.SendStatus(204)
}
