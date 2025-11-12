package routes

import (
	"github.com/gofiber/fiber/v2"

	"github.com/BenjaminAGH/nocturnescope/backend/internal/interface/http/handlers"
	"github.com/BenjaminAGH/nocturnescope/backend/internal/interface/http/middleware"
	"github.com/BenjaminAGH/nocturnescope/backend/internal/usecase/service"
)

func RegisterMetricRoutes(r fiber.Router, metricSvc *service.MetricService, tokenSvc *service.TokenService) {
    g := r.Group("/metrics")
    h := handlers.NewMetricHandler(metricSvc)

    g.Post("/", middleware.APITokenRequired(tokenSvc), h.Create)
}
