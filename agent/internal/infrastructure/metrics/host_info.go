package metrics

import (
	"os"
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
	hostname, _ := os.Hostname()

	return domain.Metric{
		UptimeSec: uptime,
		OS:        runtime.GOOS,
		Hostname:  hostname,
	}, nil
}
