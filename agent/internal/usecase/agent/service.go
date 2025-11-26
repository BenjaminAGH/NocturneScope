package agent

import (
	"time"

	"github.com/BenjaminAGH/nocturneagent/internal/domain"
)

type Collector interface {
	Collect() (domain.Metric, error)
}

type Sink interface {
	SendMetric(domain.Metric) error
	SendNetworkTraffic([]domain.NetworkTraffic) error
}

type Service struct {
	collectors       []Collector
	trafficCollector domain.NetworkTrafficCollector
	sink             Sink
	interval         time.Duration
	outChan          chan domain.Metric
	stopChan         chan struct{}
}

func NewService(cols []Collector, trafficCollector domain.NetworkTrafficCollector, sink Sink, interval time.Duration, out chan domain.Metric) *Service {
	return &Service{
		collectors:       cols,
		trafficCollector: trafficCollector,
		sink:             sink,
		interval:         interval,
		outChan:          out,
		stopChan:         make(chan struct{}),
	}
}

func (s *Service) Start() {
	// fmt.Printf("🚀 Agent service started (interval: %s)\n", s.interval)
	ticker := time.NewTicker(s.interval)
	go func() {
		defer ticker.Stop()
		for {
			s.runOnce()
			select {
			case <-ticker.C:
				continue
			case <-s.stopChan:
				return
			}
		}
	}()
}

func (s *Service) Stop() {
	close(s.stopChan)
}

func (s *Service) runOnce() {
	// 1. Collect Metrics
	base := domain.Metric{}
	for _, c := range s.collectors {
		m, err := c.Collect()
		if err != nil {
			continue
		}
		base = merge(base, m)
	}

	// enviamos al backend
	_ = s.sink.SendMetric(base)
	// y también al canal para la TUI (si hay alguien escuchando)
	select {
	case s.outChan <- base:
	default:
		// si nadie escucha no bloqueamos
	}

	// 2. Collect Network Traffic
	if s.trafficCollector != nil {
		traffic, err := s.trafficCollector.Collect()
		if err == nil && len(traffic) > 0 {
			_ = s.sink.SendNetworkTraffic(traffic)
		}
	}
}

func merge(dst, src domain.Metric) domain.Metric {
	if src.DeviceName != "" {
		dst.DeviceName = src.DeviceName
	}
	if src.IpAddress != "" {
		dst.IpAddress = src.IpAddress
	}
	if src.Gateway != "" {
		dst.Gateway = src.Gateway
	}
	if !src.Timestamp.IsZero() {
		dst.Timestamp = src.Timestamp
	}
	if src.CPUUsage != 0 {
		dst.CPUUsage = src.CPUUsage
	}
	if src.RAMUsage != 0 {
		dst.RAMUsage = src.RAMUsage
	}
	if src.DiskUsage != 0 {
		dst.DiskUsage = src.DiskUsage
	}
	if len(src.CPUPerCore) > 0 {
		dst.CPUPerCore = src.CPUPerCore
	}
	if src.UptimeSec != 0 {
		dst.UptimeSec = src.UptimeSec
	}
	if src.NetRxBytes != 0 {
		dst.NetRxBytes = src.NetRxBytes
	}
	if src.NetTxBytes != 0 {
		dst.NetTxBytes = src.NetTxBytes
	}
	if src.Temperature != 0 {
		dst.Temperature = src.Temperature
	}
	if src.OS != "" {
		dst.OS = src.OS
	}
	if src.DeviceType != "" {
		dst.DeviceType = src.DeviceType
	}
	return dst
}
