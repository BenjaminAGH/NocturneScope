//go:build windows

package daemon

import (
	"log"
	"os"
	"time"

	"github.com/kardianos/service"

	"github.com/BenjaminAGH/nocturneagent/config"
	"github.com/BenjaminAGH/nocturneagent/internal/domain"
	"github.com/BenjaminAGH/nocturneagent/internal/infrastructure/backend"
	"github.com/BenjaminAGH/nocturneagent/internal/infrastructure/metrics"
	agentuc "github.com/BenjaminAGH/nocturneagent/internal/usecase/agent"
)

type program struct {
	exit chan struct{}
}

func (p *program) Start(s service.Service) error {
	p.exit = make(chan struct{})
	go p.run()
	return nil
}

func (p *program) Stop(s service.Service) error {
	close(p.exit)
	return nil
}

func (p *program) run() {
	cfg, _ := config.Load()

	if cfg.BackendURL == "" || cfg.APIToken == "" {
		log.Println("config incompleta, no se puede iniciar el agente como servicio")
		return
	}

	metricsChan := make(chan domain.Metric, 10)

	interval, err := time.ParseDuration(cfg.Interval)
	if err != nil || interval == 0 {
		interval = 10 * time.Second
	}

	deviceName, _ := os.Hostname()
	ip := "127.0.0.1"

	collectors := []agentuc.Collector{
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

	svc := agentuc.NewService(collectors, client, interval, metricsChan)
	svc.Start()

	<-p.exit
}

// ESTA es la versión Windows
func InstallWindows(binPath string) error {
	cfg := &service.Config{
		Name:        "NocturneAgent",
		DisplayName: "Nocturne Agent",
		Description: "Agent that sends metrics to Nocturne backend",
		Executable:  binPath,
		Arguments:   []string{"agent"},
	}

	prg := &program{}
	s, err := service.New(prg, cfg)
	if err != nil {
		return err
	}

	if err := s.Install(); err != nil {
		return err
	}
	if err := s.Start(); err != nil {
		return err
	}

	log.Println("Servicio NocturneAgent instalado e iniciado.")
	return nil
}
