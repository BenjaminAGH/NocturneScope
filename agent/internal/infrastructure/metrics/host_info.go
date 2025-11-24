package metrics

import (
	"runtime"

	"github.com/BenjaminAGH/nocturneagent/internal/domain"
	"github.com/shirou/gopsutil/v3/host"
)

type HostInfoCollector struct{}

func NewHostInfoCollector() *HostInfoCollector {
	return &HostInfoCollector{}
}

func (c *HostInfoCollector) Collect() (domain.Metric, error) {
	m := domain.Metric{
		OS: runtime.GOOS,
	}
	uptime, err := host.Uptime()
	if err == nil {
		m.UptimeSec = uptime
	}
	return m, nil
}
