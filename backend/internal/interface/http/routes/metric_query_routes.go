package routes

import (
	"github.com/BenjaminAGH/nocturnescope/backend/internal/interface/http/handlers"
	"github.com/BenjaminAGH/nocturnescope/backend/internal/usecase/service"
	"github.com/gofiber/fiber/v2"
)

func RegisterMetricQueryRoutes(r fiber.Router, svc *service.MetricService) {
    h := handlers.NewMetricQueryHandler(svc)
    g := r.Group("/metrics")
    g.Get("/devices",     h.Devices)
    g.Get("/last",        h.Last)
    g.Get("/timeseries",  h.TimeSeries)
}