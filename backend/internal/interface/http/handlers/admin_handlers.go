package handlers

import (
	"strconv"

	"github.com/gofiber/fiber/v2"

	useruc "github.com/BenjaminAGH/nocturnescope/backend/internal/usecase/service"
)

type AdminHandler struct {
	userService *useruc.UserService
}

func NewAdminHandler(userService *useruc.UserService) *AdminHandler {
	return &AdminHandler{userService: userService}
}

// ListAllUsers returns all users with full details (admin only)
func (h *AdminHandler) ListAllUsers(c *fiber.Ctx) error {
	users, err := h.userService.List()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	// Return users without password hashes for security
	type UserResponse struct {
		ID        uint   `json:"id"`
		Username  string `json:"username"`
		Email     string `json:"email"`
		Role      string `json:"role"`
		CreatedAt string `json:"created_at,omitempty"`
	}

	response := make([]UserResponse, len(users))
	for i, u := range users {
		response[i] = UserResponse{
			ID:       u.ID,
			Username: u.Username,
			Email:    u.Email,
			Role:     u.Role,
		}
	}

	return c.JSON(response)
}

// CreateUser creates a new user (admin only)
func (h *AdminHandler) CreateUser(c *fiber.Ctx) error {
	var body struct {
		Username string `json:"username"`
		Email    string `json:"email"`
		Role     string `json:"role"`
		Password string `json:"password"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "bad request"})
	}

	// Validate required fields
	if body.Username == "" || body.Email == "" || body.Password == "" {
		return c.Status(400).JSON(fiber.Map{"error": "username, email and password are required"})
	}

	// Default role to "user" if not specified
	if body.Role == "" {
		body.Role = "user"
	}

	u, err := h.userService.Create(useruc.CreateUserInput{
		Username: body.Username,
		Email:    body.Email,
		Role:     body.Role,
		Password: body.Password,
	})
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	// Return user without password
	return c.Status(201).JSON(fiber.Map{
		"id":       u.ID,
		"username": u.Username,
		"email":    u.Email,
		"role":     u.Role,
	})
}

// UpdateUser updates an existing user (admin only)
func (h *AdminHandler) UpdateUser(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid user id"})
	}

	var body struct {
		Username *string `json:"username"`
		Email    *string `json:"email"`
		Role     *string `json:"role"`
		Password *string `json:"password"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "bad request"})
	}

	u, err := h.userService.Update(uint(id), useruc.UpdateUserInput{
		Username: body.Username,
		Email:    body.Email,
		Role:     body.Role,
		Password: body.Password,
	})
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	// Return user without password
	return c.JSON(fiber.Map{
		"id":       u.ID,
		"username": u.Username,
		"email":    u.Email,
		"role":     u.Role,
	})
}

// DeleteUser deletes a user (admin only)
func (h *AdminHandler) DeleteUser(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid user id"})
	}

	// Prevent deleting yourself
	uidAny := c.Locals("user_id")
	if uidAny != nil {
		currentUserID := uint(uidAny.(float64))
		if currentUserID == uint(id) {
			return c.Status(400).JSON(fiber.Map{"error": "cannot delete yourself"})
		}
	}

	if err := h.userService.Delete(uint(id)); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	return c.SendStatus(fiber.StatusNoContent)
}
