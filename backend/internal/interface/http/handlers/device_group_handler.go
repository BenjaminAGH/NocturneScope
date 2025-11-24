package handlers

import (
	"github.com/gofiber/fiber/v2"

	"github.com/BenjaminAGH/nocturnescope/backend/internal/usecase/service"
)

type DeviceGroupHandler struct {
	svc *service.DeviceGroupService
}

func NewDeviceGroupHandler(svc *service.DeviceGroupService) *DeviceGroupHandler {
	return &DeviceGroupHandler{svc: svc}
}

// Create handles POST /api/device-groups
func (h *DeviceGroupHandler) Create(c *fiber.Ctx) error {
	userIDAny := c.Locals("user_id")
	if userIDAny == nil {
		return c.Status(401).JSON(fiber.Map{"error": "unauthorized"})
	}

	var userID uint
	switch v := userIDAny.(type) {
	case uint:
		userID = v
	case float64:
		userID = uint(v)
	default:
		return c.Status(401).JSON(fiber.Map{"error": "invalid user_id type"})
	}

	var req struct {
		Name        string `json:"name"`
		Description string `json:"description"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request body"})
	}

	if req.Name == "" {
		return c.Status(400).JSON(fiber.Map{"error": "name is required"})
	}

	group, err := h.svc.Create(userID, req.Name, req.Description)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(201).JSON(group)
}

// List handles GET /api/device-groups
func (h *DeviceGroupHandler) List(c *fiber.Ctx) error {
	userIDAny := c.Locals("user_id")
	if userIDAny == nil {
		return c.Status(401).JSON(fiber.Map{"error": "unauthorized"})
	}

	var userID uint
	switch v := userIDAny.(type) {
	case uint:
		userID = v
	case float64:
		userID = uint(v)
	default:
		return c.Status(401).JSON(fiber.Map{"error": "invalid user_id type"})
	}

	groups, err := h.svc.ListByUser(userID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(groups)
}

// Get handles GET /api/device-groups/:id
func (h *DeviceGroupHandler) Get(c *fiber.Ctx) error {
	userIDAny := c.Locals("user_id")
	if userIDAny == nil {
		return c.Status(401).JSON(fiber.Map{"error": "unauthorized"})
	}

	var userID uint
	switch v := userIDAny.(type) {
	case uint:
		userID = v
	case float64:
		userID = uint(v)
	default:
		return c.Status(401).JSON(fiber.Map{"error": "invalid user_id type"})
	}

	id, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid id"})
	}

	group, err := h.svc.GetByID(uint(id), userID)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "group not found"})
	}

	return c.JSON(group)
}

// Update handles PUT /api/device-groups/:id
func (h *DeviceGroupHandler) Update(c *fiber.Ctx) error {
	userIDAny := c.Locals("user_id")
	if userIDAny == nil {
		return c.Status(401).JSON(fiber.Map{"error": "unauthorized"})
	}

	var userID uint
	switch v := userIDAny.(type) {
	case uint:
		userID = v
	case float64:
		userID = uint(v)
	default:
		return c.Status(401).JSON(fiber.Map{"error": "invalid user_id type"})
	}

	id, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid id"})
	}

	var req struct {
		Name        string `json:"name"`
		Description string `json:"description"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request body"})
	}

	if req.Name == "" {
		return c.Status(400).JSON(fiber.Map{"error": "name is required"})
	}

	if err := h.svc.Update(uint(id), userID, req.Name, req.Description); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.SendStatus(204)
}

// Delete handles DELETE /api/device-groups/:id
func (h *DeviceGroupHandler) Delete(c *fiber.Ctx) error {
	userIDAny := c.Locals("user_id")
	if userIDAny == nil {
		return c.Status(401).JSON(fiber.Map{"error": "unauthorized"})
	}

	var userID uint
	switch v := userIDAny.(type) {
	case uint:
		userID = v
	case float64:
		userID = uint(v)
	default:
		return c.Status(401).JSON(fiber.Map{"error": "invalid user_id type"})
	}

	id, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid id"})
	}

	if err := h.svc.Delete(uint(id), userID); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.SendStatus(204)
}
