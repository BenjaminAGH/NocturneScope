package middleware

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"

	"github.com/BenjaminAGH/nocturnescope/backend/internal/infrastructure/security"
	"github.com/BenjaminAGH/nocturnescope/backend/internal/usecase/service"
)

func JWTProtected(jwtService *security.JWTService, authService *service.AuthService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(401).JSON(fiber.Map{"error": "missing token"})
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			return c.Status(401).JSON(fiber.Map{"error": "invalid token format"})
		}

		tokenStr := parts[1]
		token, err := jwtService.ValidateToken(tokenStr)
		if err != nil || !token.Valid {
			return c.Status(401).JSON(fiber.Map{"error": "invalid token"})
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			return c.Status(401).JSON(fiber.Map{"error": "invalid token claims"})
		}

		tidVal, ok := claims["tid"]
		if !ok {
			return c.Status(401).JSON(fiber.Map{"error": "token without tid"})
		}

		tokenID, _ := tidVal.(string)
		if !authService.IsValid(tokenID) {
			return c.Status(401).JSON(fiber.Map{"error": "session expired"})
		}

		c.Locals("user_id", claims["sub"])
		c.Locals("role", claims["role"])
		c.Locals("tid", tokenID)

		return c.Next()
	}
}