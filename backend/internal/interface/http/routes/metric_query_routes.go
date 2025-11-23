package routes

import (
	"github.com/gofiber/fiber/v2"

	"github.com/BenjaminAGH/nocturnescope/backend/internal/domain"
	"github.com/BenjaminAGH/nocturnescope/backend/internal/interface/http/handlers"
	"github.com/BenjaminAGH/nocturnescope/backend/internal/usecase/service"
)

func RegisterMetricQueryRoutes(r fiber.Router, svc *service.MetricService, tokenRepo domain.APITokenRepository) {
	h := handlers.NewMetricQueryHandler(svc, tokenRepo)
	r.Get("/metrics/devices", h.Devices)
	r.Get("/metrics/last", h.Last)
	r.Get("/metrics/timeseries", h.TimeSeries)
	r.Get("/metrics/history", h.History)
}
