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
		// Filter out Unix sockets and other non-network connections
		// Abstract sockets start with @, file sockets contain /
		if len(conn.Laddr.IP) > 0 && (conn.Laddr.IP[0] == '@' || conn.Laddr.IP[0] == '/') {
			continue
		}
		// Also check for path characters in what should be an IP
		if contains(conn.Laddr.IP, "/") {
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

		// Try to resolve application protocol based on ports
		appProto := resolveProtocol(int(conn.Raddr.Port), protocol)
		if appProto != "" {
			protocol = appProto
		} else {
			// Try local port if remote didn't match (e.g. for listening sockets)
			appProto = resolveProtocol(int(conn.Laddr.Port), protocol)
			if appProto != "" {
				protocol = appProto
			}
		}

		// Determine which port to show (prefer well-known service ports)
		rPort := int(conn.Raddr.Port)
		lPort := int(conn.Laddr.Port)

		displayPort := rPort

		// Check if ports are well-known services
		rName := resolveProtocol(rPort, "")
		lName := resolveProtocol(lPort, "")

		if rName != "" {
			// Remote is a service (e.g. we are connecting to 443)
			displayPort = rPort
		} else if lName != "" {
			// Local is a service (e.g. someone connecting to our 22)
			displayPort = lPort
		} else {
			// Neither is well-known, default to remote
			displayPort = rPort
		}

		// Fallback for LISTEN or 0
		if displayPort == 0 {
			displayPort = lPort
		}

		t := domain.NetworkTraffic{
			Protocol:        protocol,
			SourceIP:        conn.Laddr.IP,
			DestinationIP:   conn.Raddr.IP,
			DestinationPort: displayPort,
			ConnectionState: conn.Status,
			ThreatLevel:     threatLevel,
			Duration:        0, // gopsutil doesn't provide duration easily without tracking
			Timestamp:       time.Now(),
		}
		traffic = append(traffic, t)
	}

	return traffic, nil
}

func contains(s, substr string) bool {
	for i := 0; i < len(s)-len(substr)+1; i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}

func resolveProtocol(port int, transport string) string {
	switch port {
	case 80:
		return "HTTP"
	case 443:
		return "HTTPS"
	case 22:
		return "SSH"
	case 53:
		return "DNS"
	case 21:
		return "FTP"
	case 25:
		return "SMTP"
	case 110:
		return "POP3"
	case 143:
		return "IMAP"
	case 3306:
		return "MySQL"
	case 5432:
		return "PostgreSQL"
	case 6379:
		return "Redis"
	case 27017:
		return "MongoDB"
	case 8080:
		return "HTTP-Alt"
	case 123:
		return "NTP"
	}
	return "" // Return empty if no specific match, keep transport
}
