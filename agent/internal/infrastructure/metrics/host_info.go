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
	uptime, err := host.Uptime()
	if err != nil {
		return domain.Metric{}, err
	}
	return domain.Metric{
		UptimeSec: uptime,
		OS:        runtime.GOOS,
	}, nil
}
