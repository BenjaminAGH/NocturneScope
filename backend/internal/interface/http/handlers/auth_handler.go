package handlers

import (
	"regexp"
	"unicode"

	"github.com/gofiber/fiber/v2"

	"github.com/BenjaminAGH/nocturnescope/backend/internal/domain"
	"github.com/BenjaminAGH/nocturnescope/backend/internal/usecase/service"
)

var (
	emailRegex = regexp.MustCompile(`^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,4}$`)
	userRegex  = regexp.MustCompile(`^[a-zA-Z0-9]+$`)
)

func validatePassword(s string) bool {
	var (
		hasMinLen = false
		hasLetter = false
		hasNumber = false
	)
	if len(s) >= 6 {
		hasMinLen = true
	}
	for _, char := range s {
		switch {
		case unicode.IsLetter(char):
			hasLetter = true
		case unicode.IsNumber(char):
			hasNumber = true
		}
	}
	return hasMinLen && hasLetter && hasNumber
}

type AuthHandler struct {
	authService *service.AuthService
	userService *service.UserService
}

func NewAuthHandler(authService *service.AuthService, userService *service.UserService) *AuthHandler {
	return &AuthHandler{
		authService: authService,
		userService: userService,
	}
}

type UserResponse struct {
	ID       uint   `json:"id"`
	Username string `json:"username"`
	Email    string `json:"email"`
	Role     string `json:"role"`
}

func toUserResponse(u domain.User) UserResponse {
	return UserResponse{
		ID:       u.ID,
		Username: u.Username,
		Email:    u.Email,
		Role:     u.Role,
	}
}

func (h *AuthHandler) Register(c *fiber.Ctx) error {
	var body struct {
		Username string `json:"username"`
		Email    string `json:"email"`
		Role     string `json:"role"`
		Password string `json:"password"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "bad request"})
	}

	// Validations
	if len(body.Username) < 3 || len(body.Username) > 20 || !userRegex.MatchString(body.Username) {
		return c.Status(400).JSON(fiber.Map{"error": "username must be 3-20 alphanumeric characters"})
	}
	if !emailRegex.MatchString(body.Email) {
		return c.Status(400).JSON(fiber.Map{"error": "invalid email format"})
	}
	if body.Role != "admin" && body.Role != "user" && body.Role != "admindev" {
		return c.Status(400).JSON(fiber.Map{"error": "invalid role"})
	}
	if !validatePassword(body.Password) {
		return c.Status(400).JSON(fiber.Map{"error": "password must be at least 6 characters and contain letters and numbers"})
	}

	user, err := h.userService.Create(service.CreateUserInput{
		Username: body.Username,
		Email:    body.Email,
		Role:     body.Role,
		Password: body.Password,
	})
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(201).JSON(toUserResponse(*user))
}

func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "bad request"})
	}

	// Validations
	if !emailRegex.MatchString(body.Email) {
		return c.Status(400).JSON(fiber.Map{"error": "invalid email format"})
	}
	if !validatePassword(body.Password) {
		return c.Status(400).JSON(fiber.Map{"error": "password must be at least 6 characters and contain letters and numbers"})
	}

	tokens, err := h.authService.Login(body.Email, body.Password)
	if err != nil {
		return c.Status(401).JSON(fiber.Map{"error": "invalid credentials"})
	}

	return c.JSON(tokens)
}

func (h *AuthHandler) Refresh(c *fiber.Ctx) error {
	var body struct {
		RefreshToken string `json:"refresh_token"`
	}
	if err := c.BodyParser(&body); err != nil || body.RefreshToken == "" {
		return c.Status(400).JSON(fiber.Map{"error": "refresh token required"})
	}

	tokens, err := h.authService.Refresh(body.RefreshToken)
	if err != nil {
		return c.Status(401).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(tokens)
}

func (h *AuthHandler) Logout(c *fiber.Ctx) error {
	tokenID := c.Locals("tid")
	if tokenID == nil {
		return c.Status(400).JSON(fiber.Map{"error": "missing token id"})
	}

	if err := h.authService.Logout(tokenID.(string)); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(200).JSON(fiber.Map{
		"message": "sesión cerrada correctamente",
	})
}
