package routes

import (
	"github.com/BenjaminAGH/nocturnescope/backend/internal/interface/http/handlers"
	"github.com/BenjaminAGH/nocturnescope/backend/internal/interface/http/middleware"
	"github.com/BenjaminAGH/nocturnescope/backend/internal/usecase/service"
	"github.com/gofiber/fiber/v2"
)

func RegisterNetworkTrafficRoutes(r fiber.Router, trafficSvc *service.NetworkTrafficService, tokenSvc *service.TokenService) {
	h := handlers.NewNetworkTrafficHandler(trafficSvc)

	// Route for agents to post traffic data (protected by API Token)
	r.Post("/network-traffic", middleware.APITokenRequired(tokenSvc), h.ReceiveTraffic)
}

func RegisterNetworkTrafficUserRoutes(r fiber.Router, trafficSvc *service.NetworkTrafficService) {
	h := handlers.NewNetworkTrafficHandler(trafficSvc)

	// Route for frontend to get traffic logs (protected by User Auth)
	r.Get("/network-traffic", h.GetTraffic)
	r.Get("/network-traffic/:deviceId", h.GetTraffic)
}
