package metrics

import (
	"net"
	"os/exec"
	"runtime"
	"strings"

	"github.com/BenjaminAGH/nocturneagent/internal/domain"
)

type GatewayCollector struct{}

func NewGatewayCollector() *GatewayCollector {
	return &GatewayCollector{}
}

func (c *GatewayCollector) Collect() (domain.Metric, error) {
	m := domain.Metric{}
	gateway := detectGateway()
	if gateway != "" {
		m.Gateway = gateway
	}
	return m, nil
}

func detectGateway() string {
	switch runtime.GOOS {
	case "linux":
		return detectGatewayLinux()
	case "darwin":
		return detectGatewayDarwin()
	case "windows":
		return detectGatewayWindows()
	default:
		return ""
	}
}

func detectGatewayLinux() string {
	// Usar 'ip route' para obtener el gateway predeterminado
	cmd := exec.Command("ip", "route", "show", "default")
	output, err := cmd.Output()
	if err != nil {
		return ""
	}

	// Formato: "default via 192.168.1.1 dev eth0"
	lines := strings.Split(string(output), "\n")
	for _, line := range lines {
		if strings.HasPrefix(line, "default via ") {
			parts := strings.Fields(line)
			if len(parts) >= 3 {
				ip := parts[2]
				if isValidIP(ip) {
					return ip
				}
			}
		}
	}

	return ""
}

func detectGatewayDarwin() string {
	// Usar 'route -n get default' en macOS
	cmd := exec.Command("route", "-n", "get", "default")
	output, err := cmd.Output()
	if err != nil {
		return ""
	}

	// Buscar línea "gateway: 192.168.1.1"
	lines := strings.Split(string(output), "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "gateway:") {
			parts := strings.Fields(line)
			if len(parts) >= 2 {
				ip := parts[1]
				if isValidIP(ip) {
					return ip
				}
			}
		}
	}

	return ""
}

func detectGatewayWindows() string {
	// Usar 'route print' en Windows
	cmd := exec.Command("route", "print", "0.0.0.0")
	output, err := cmd.Output()
	if err != nil {
		return ""
	}

	// Buscar la ruta predeterminada 0.0.0.0
	lines := strings.Split(string(output), "\n")
	for _, line := range lines {
		if strings.Contains(line, "0.0.0.0") {
			parts := strings.Fields(line)
			// El gateway suele estar en la tercera columna
			if len(parts) >= 3 {
				ip := parts[2]
				if isValidIP(ip) && ip != "0.0.0.0" {
					return ip
				}
			}
		}
	}

	return ""
}

func isValidIP(ip string) bool {
	return net.ParseIP(ip) != nil
}
