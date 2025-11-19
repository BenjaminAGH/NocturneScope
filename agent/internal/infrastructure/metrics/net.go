package metrics

import (
	"github.com/shirou/gopsutil/v3/net"
	"github.com/BenjaminAGH/nocturneagent/internal/domain"
)

type NetCollector struct{}

func NewNetCollector() *NetCollector {
	return &NetCollector{}
}

func (c *NetCollector) Collect() (domain.Metric, error) {
	stats, err := net.IOCounters(false)
	if err != nil || len(stats) == 0 {
		return domain.Metric{}, err
	}
	s := stats[0]
	return domain.Metric{
		NetRxBytes: s.BytesRecv,
		NetTxBytes: s.BytesSent,
	}, nil
}
