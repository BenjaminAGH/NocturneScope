package handlers

import (
	"strconv"

	"github.com/gofiber/fiber/v2"

	"github.com/BenjaminAGH/nocturnescope/backend/internal/usecase/service"
)

type APITokenHandler struct {
	svc *service.TokenService
}

func NewAPITokenHandler(svc *service.TokenService) *APITokenHandler {
	return &APITokenHandler{svc: svc}
}

func (h *APITokenHandler) Create(c *fiber.Ctx) error {
	var body struct {
		Name       string `json:"name"`
		DeviceName string `json:"device_name"`
	}
	if err := c.BodyParser(&body); err != nil || body.Name == "" || body.DeviceName == "" {
		return c.Status(400).JSON(fiber.Map{"error": "name and device_name required"})
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

	raw, err := h.svc.GenerateForUser(body.Name, body.DeviceName, uid)
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

	return c.JSON(tokens)
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
