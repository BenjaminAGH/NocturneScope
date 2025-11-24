package metrics

import (
	"time"

	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/disk"
	"github.com/shirou/gopsutil/v3/mem"

	"github.com/BenjaminAGH/nocturneagent/internal/domain"
)

// reemplaza al antiguo NewSystemCollector
type BasicSystemCollector struct {
	deviceName string
	ipAddress  string
}

func NewBasicSystemCollector(deviceName, ipAddress string) *BasicSystemCollector {
	return &BasicSystemCollector{deviceName: deviceName, ipAddress: ipAddress}
}

func (c *BasicSystemCollector) Collect() (domain.Metric, error) {
	m := domain.Metric{
		DeviceName: c.deviceName,
		IpAddress:  c.ipAddress,
		Timestamp:  time.Now(),
	}

	cpuPercent, err := cpu.Percent(0, false)
	if err == nil && len(cpuPercent) > 0 {
		m.CPUUsage = cpuPercent[0]
	}

	memInfo, err := mem.VirtualMemory()
	if err == nil {
		m.RAMUsage = memInfo.UsedPercent
	}

	diskInfo, err := disk.Usage("/")
	if err == nil {
		m.DiskUsage = diskInfo.UsedPercent
	}

	return m, nil
}
