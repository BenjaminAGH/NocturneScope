package routes

import (
	"github.com/BenjaminAGH/nocturnescope/backend/internal/interface/http/handlers"
	"github.com/BenjaminAGH/nocturnescope/backend/internal/usecase/service"
	"github.com/gofiber/fiber/v2"
)

func RegisterTopologyRoutes(r fiber.Router, svc *service.TopologyService) {
	h := handlers.NewTopologyHandler(svc)
	g := r.Group("/topologies")

	g.Post("/", h.Create)
	g.Get("/", h.List)
	g.Get("/debug/logs", h.GetDebugLog)
	g.Get("/:id", h.Get)
	g.Put("/:id", h.Update)
	g.Delete("/:id", h.Delete)
}
