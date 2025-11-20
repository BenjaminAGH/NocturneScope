package main

import (
	"fmt"
	"net"
	"os/exec"
	"runtime"
	"strings"
)

func main() {
	fmt.Println("OS:", runtime.GOOS)
	gw := detectGateway()
	fmt.Println("Gateway detected:", gw)
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
	cmd := exec.Command("ip", "route", "show", "default")
	output, err := cmd.Output()
	if err != nil {
		fmt.Println("Error running ip route:", err)
		return ""
	}
	fmt.Println("Output ip route:", string(output))

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
	cmd := exec.Command("route", "-n", "get", "default")
	output, err := cmd.Output()
	if err != nil {
		return ""
	}
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
	cmd := exec.Command("route", "print", "0.0.0.0")
	output, err := cmd.Output()
	if err != nil {
		return ""
	}
	lines := strings.Split(string(output), "\n")
	for _, line := range lines {
		if strings.Contains(line, "0.0.0.0") {
			parts := strings.Fields(line)
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
