package metrics

import (
	"os"

	"github.com/BenjaminAGH/nocturneagent/internal/domain"
	"github.com/shirou/gopsutil/v3/host"
)

type HostInfoCollector struct{}

func NewHostInfoCollector() *HostInfoCollector {
	return &HostInfoCollector{}
}

func (c *HostInfoCollector) Collect() (domain.Metric, error) {
	info, err := host.Info()
	if err != nil {
		return domain.Metric{}, err
	}
	hostname, _ := os.Hostname()

	return domain.Metric{
		UptimeSec: info.Uptime,
		OS:        info.Platform + " " + info.PlatformVersion,
		Hostname:  hostname,
	}, nil
}
