package routes

import (
	"github.com/gofiber/fiber/v2"

	"github.com/BenjaminAGH/nocturnescope/backend/internal/interface/http/handlers"
	"github.com/BenjaminAGH/nocturnescope/backend/internal/usecase/service"
)

func RegisterDeviceGroupRoutes(r fiber.Router, svc *service.DeviceGroupService) {
	h := handlers.NewDeviceGroupHandler(svc)

	r.Post("/device-groups", h.Create)
	r.Get("/device-groups", h.List)
	r.Get("/device-groups/:id", h.Get)
	r.Put("/device-groups/:id", h.Update)
	r.Delete("/device-groups/:id", h.Delete)
}
