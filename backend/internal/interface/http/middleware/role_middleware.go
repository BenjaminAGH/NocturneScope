package middleware

import "github.com/gofiber/fiber/v2"

func RequireRole(role string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		r := c.Locals("role")
		if r == nil {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "forbidden"})
		}
		if r.(string) != role {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "forbidden"})
		}
		return c.Next()
	}
}

func RequireAnyRole(roles ...string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		r := c.Locals("role")
		if r == nil {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "forbidden"})
		}
		current := r.(string)
		for _, allowed := range roles {
			if current == allowed {
				return c.Next()
			}
		}
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "forbidden"})
	}
}
