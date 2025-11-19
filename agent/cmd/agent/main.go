package main

import (
	"log"
	"os"
	"time"

	"github.com/BenjaminAGH/nocturneagent/config"
	"github.com/BenjaminAGH/nocturneagent/internal/infrastructure/backend"
	"github.com/BenjaminAGH/nocturneagent/internal/infrastructure/metrics"
	"github.com/BenjaminAGH/nocturneagent/internal/interface/scheduler"
	"github.com/BenjaminAGH/nocturneagent/internal/usecase/collect"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("no se pudo cargar config: %v (ejecuta primero `nocturneagent` cli)", err)
	}

	interval, err := time.ParseDuration(cfg.Interval)
	if err != nil {
		interval = 10 * time.Second
	}

	deviceName, _ := os.Hostname()
	ip := "127.0.0.1"

	collectors := []collect.Collector{
		metrics.NewBasicSystemCollector(deviceName, ip),
		metrics.NewCPUPerCoreCollector(),
		metrics.NewHostInfoCollector(),
		metrics.NewNetCollector(),
		metrics.NewDeviceTypeCollector(cfg.DeviceType),
		metrics.NewTemperatureCollector(),
	}

	client := backend.NewHTTPClient(
		cfg.BackendURL,
		cfg.APIToken,
		backend.WithQueue(200),
		backend.WithRetry(4, time.Second),
	)

	svc := collect.NewService(collectors, client)

	log.Printf("NocturneAgent iniciado (cada %s)\n", interval)
	scheduler.Start(svc, interval)
}
