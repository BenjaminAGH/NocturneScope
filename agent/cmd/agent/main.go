package main

import (
	"log"
	"net"
	"os"
	"time"

	tea "github.com/charmbracelet/bubbletea"

	"github.com/BenjaminAGH/nocturneagent/config"
	"github.com/BenjaminAGH/nocturneagent/internal/domain"
	"github.com/BenjaminAGH/nocturneagent/internal/infrastructure/backend"
	"github.com/BenjaminAGH/nocturneagent/internal/infrastructure/metrics"
	cliui "github.com/BenjaminAGH/nocturneagent/internal/interface/cli"
	agentuc "github.com/BenjaminAGH/nocturneagent/internal/usecase/agent"
)

func main() {
	// 👇 si me llamaron como: nocturneagent agent
	if len(os.Args) > 1 && os.Args[1] == "agent" {
		runAgentOnly()
		return
	}

	// modo TUI
	runTUI()
}

func runTUI() {
	cfg, _ := config.Load()
	metricsChan := make(chan domain.Metric, 10)

	// arrancar agente embebido SOLO si hay config completa
	if cfg.BackendURL != "" && cfg.APIToken != "" {
		startAgentFromConfig(cfg, metricsChan, true)
	}

	m := cliui.NewModel(cfg, metricsChan, cfg.BackendURL == "")

	finalModel, err := tea.NewProgram(m).StartReturningModel()
	if err != nil {
		log.Fatal(err)
	}

	fm := finalModel.(cliui.Model)

	// si la TUI dijo “quedarme” (modo goroutine), nos quedamos
	if fm.ShouldKeepRunning() {
		select {}
	}
}

func runAgentOnly() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("no se pudo cargar config: %v", err)
	}
	metricsChan := make(chan domain.Metric, 10)
	startAgentFromConfig(cfg, metricsChan, false)
	// agente en foreground
	select {}
}

func startAgentFromConfig(cfg config.AgentConfig, metricsChan chan domain.Metric, silent bool) {
	interval, _ := time.ParseDuration(cfg.Interval)
	if interval == 0 {
		interval = 10 * time.Second
	}

	deviceName, _ := os.Hostname()
	ip := getOutboundIP()

	collectors := []agentuc.Collector{
		metrics.NewBasicSystemCollector(deviceName, ip),
		metrics.NewCPUPerCoreCollector(),
		metrics.NewHostInfoCollector(),
		metrics.NewNetCollector(),
		metrics.NewDeviceTypeCollector(cfg.DeviceType),
		metrics.NewTemperatureCollector(),
		metrics.NewGatewayCollector(),
	}

	client := backend.NewHTTPClient(
		cfg.BackendURL,
		cfg.APIToken,
		backend.WithQueue(200),
		backend.WithRetry(4, time.Second),
		backend.WithSilent(silent),
	)

	svc := agentuc.NewService(collectors, client, interval, metricsChan)
	svc.Start()
}

func getOutboundIP() string {
	conn, err := net.Dial("udp", "8.8.8.8:80")
	if err != nil {
		return "127.0.0.1"
	}
	defer conn.Close()

	localAddr := conn.LocalAddr().(*net.UDPAddr)

	return localAddr.IP.String()
}
