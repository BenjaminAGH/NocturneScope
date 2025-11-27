package middleware

import (
	"github.com/gofiber/fiber/v2"

	"github.com/BenjaminAGH/nocturnescope/backend/internal/usecase/service"
)

func APITokenRequired(tokenService *service.TokenService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		token := c.Get("X-API-Key")
		if token == "" {
			return c.Status(401).JSON(fiber.Map{"error": "missing api token"})
		}

		tokenObj, err := tokenService.Validate(token)
		if err != nil {
			return c.Status(401).JSON(fiber.Map{"error": "invalid api token"})
		}
		c.Locals("token", tokenObj)

		return c.Next()
	}
}
