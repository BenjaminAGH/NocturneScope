package collect

import (
	"log"

	"github.com/BenjaminAGH/nocturneagent/internal/domain"
)

type Collector interface {
	Collect() (domain.Metric, error)
}

type BackendSink interface {
	SendMetric(domain.Metric) error
	SendNetworkTraffic([]domain.NetworkTraffic) error
}

type Service struct {
	collectors       []Collector
	trafficCollector domain.NetworkTrafficCollector
	backend          BackendSink
}

func NewService(collectors []Collector, trafficCollector domain.NetworkTrafficCollector, backend BackendSink) *Service {
	return &Service{
		collectors:       collectors,
		trafficCollector: trafficCollector,
		backend:          backend,
	}
}

func (s *Service) RunOnce() {
	// 1. Collect Metrics
	base := domain.Metric{}
	for _, c := range s.collectors {
		m, err := c.Collect()
		if err != nil {
			log.Println("collector error:", err)
			continue
		}
		base = mergeMetric(base, m)
	}

	if err := s.backend.SendMetric(base); err != nil {
		log.Println("send error:", err)
	}

	// 2. Collect Network Traffic
	if s.trafficCollector != nil {
		traffic, err := s.trafficCollector.Collect()
		if err != nil {
			log.Println("traffic collector error:", err)
		} else if len(traffic) > 0 {
			if err := s.backend.SendNetworkTraffic(traffic); err != nil {
				log.Println("send traffic error:", err)
			}
		}
	}
}

// mergeMetric pisa solo los campos que vienen con valor
func mergeMetric(dst, src domain.Metric) domain.Metric {
	// strings
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
	if src.OS != "" {
		dst.OS = src.OS
	}
	if src.DeviceType != "" {
		dst.DeviceType = src.DeviceType
	}

	// floats (si vienen en 0 puede ser un valor real, así que los copiamos igual)
	if src.CPUUsage != 0 {
		dst.CPUUsage = src.CPUUsage
	}
	if src.RAMUsage != 0 {
		dst.RAMUsage = src.RAMUsage
	}
	if src.DiskUsage != 0 {
		dst.DiskUsage = src.DiskUsage
	}
	if src.Temperature != 0 {
		dst.Temperature = src.Temperature
	}

	// slices
	if len(src.CPUPerCore) > 0 {
		dst.CPUPerCore = src.CPUPerCore
	}
	if len(src.TopProcs) > 0 {
		dst.TopProcs = src.TopProcs
	}
	if len(src.DiskPartitions) > 0 {
		dst.DiskPartitions = src.DiskPartitions
	}

	// uints
	if src.UptimeSec != 0 {
		dst.UptimeSec = src.UptimeSec
	}
	if src.NetRxBytes != 0 {
		dst.NetRxBytes = src.NetRxBytes
	}
	if src.NetTxBytes != 0 {
		dst.NetTxBytes = src.NetTxBytes
	}
	if src.RAMTotal != 0 {
		dst.RAMTotal = src.RAMTotal
	}
	if src.RAMUsed != 0 {
		dst.RAMUsed = src.RAMUsed
	}
	if src.RAMFree != 0 {
		dst.RAMFree = src.RAMFree
	}
	if src.DiskTotal != 0 {
		dst.DiskTotal = src.DiskTotal
	}
	if src.DiskUsed != 0 {
		dst.DiskUsed = src.DiskUsed
	}
	if src.DiskFree != 0 {
		dst.DiskFree = src.DiskFree
	}

	return dst
}
