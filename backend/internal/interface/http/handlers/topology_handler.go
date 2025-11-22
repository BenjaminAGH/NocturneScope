package handlers

import (
	"encoding/json"
	"strconv"

	"github.com/gofiber/fiber/v2"

	"github.com/BenjaminAGH/nocturnescope/backend/internal/usecase/service"
)

type TopologyHandler struct {
	svc *service.TopologyService
}

func NewTopologyHandler(svc *service.TopologyService) *TopologyHandler {
	return &TopologyHandler{svc: svc}
}

// Create creates a new topology
// POST /api/topologies
func (h *TopologyHandler) Create(c *fiber.Ctx) error {
	var body struct {
		Name string      `json:"name"`
		Data interface{} `json:"data"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request body"})
	}

	if body.Name == "" {
		return c.Status(400).JSON(fiber.Map{"error": "name is required"})
	}

	// Obtener user_id del contexto (middleware JWT)
	uidAny := c.Locals("user_id")
	if uidAny == nil {
		return c.Status(401).JSON(fiber.Map{"error": "unauthorized"})
	}
	uid := uint(uidAny.(float64))

	// Serializar el campo data a JSON string
	dataBytes, err := json.Marshal(body.Data)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid data field"})
	}

	topology, err := h.svc.Save(uid, body.Name, string(dataBytes))
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(201).JSON(topology)
}

// List returns all topologies for the authenticated user
// GET /api/topologies
func (h *TopologyHandler) List(c *fiber.Ctx) error {
	uidAny := c.Locals("user_id")
	if uidAny == nil {
		return c.Status(401).JSON(fiber.Map{"error": "unauthorized"})
	}
	uid := uint(uidAny.(float64))

	topologies, err := h.svc.List(uid)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(topologies)
}

// Get returns a specific topology
// GET /api/topologies/:id
func (h *TopologyHandler) Get(c *fiber.Ctx) error {
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

	topology, err := h.svc.Get(uint(id), uid)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "topology not found"})
	}

	return c.JSON(topology)
}

// Update updates an existing topology
// PUT /api/topologies/:id
func (h *TopologyHandler) Update(c *fiber.Ctx) error {
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

	var body struct {
		Name string      `json:"name"`
		Data interface{} `json:"data"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request body"})
	}

	if body.Name == "" {
		return c.Status(400).JSON(fiber.Map{"error": "name is required"})
	}

	// Serializar el campo data a JSON string
	dataBytes, err := json.Marshal(body.Data)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid data field"})
	}

	topology, err := h.svc.Update(uint(id), uid, body.Name, string(dataBytes))
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(topology)
}

// Delete deletes a topology
// DELETE /api/topologies/:id
func (h *TopologyHandler) Delete(c *fiber.Ctx) error {
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

	if err := h.svc.Delete(uint(id), uid); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.SendStatus(204)
}
