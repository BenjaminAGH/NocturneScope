package metrics

import (
	"time"

	"github.com/BenjaminAGH/nocturneagent/internal/domain"
	"github.com/shirou/gopsutil/v3/net"
)

type NetworkTrafficCollector struct{}

func NewNetworkTrafficCollector() *NetworkTrafficCollector {
	return &NetworkTrafficCollector{}
}

func (c *NetworkTrafficCollector) Collect() ([]domain.NetworkTraffic, error) {
	connections, err := net.Connections("all")
	if err != nil {
		return nil, err
	}

	var traffic []domain.NetworkTraffic
	for _, conn := range connections {
		// Filter loopback if needed, but for now let's keep everything or filter 127.0.0.1
		if conn.Laddr.IP == "127.0.0.1" || conn.Laddr.IP == "::1" {
			continue
		}

		// Simple threat level logic (placeholder)
		threatLevel := "LOW"
		if conn.Status == "LISTEN" {
			threatLevel = "MEDIUM" // Listening ports might be interesting
		}

		// Protocol mapping
		protocol := "UNKNOWN"
		switch conn.Type {
		case 1: // TCP
			protocol = "TCP"
		case 2: // UDP
			protocol = "UDP"
		}

		t := domain.NetworkTraffic{
			Protocol:        protocol,
			SourceIP:        conn.Laddr.IP,
			DestinationPort: int(conn.Raddr.Port),
			ConnectionState: conn.Status,
			ThreatLevel:     threatLevel,
			Duration:        0, // gopsutil doesn't provide duration easily without tracking
			Timestamp:       time.Now(),
		}
		traffic = append(traffic, t)
	}

	return traffic, nil
}
