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
	cpuPercent, err := cpu.Percent(0, false)
	if err != nil {
		return domain.Metric{}, err
	}
	memInfo, err := mem.VirtualMemory()
	if err != nil {
		return domain.Metric{}, err
	}
	diskInfo, err := disk.Usage("/")
	if err != nil {
		return domain.Metric{}, err
	}

	return domain.Metric{
		DeviceName: c.deviceName,
		IpAddress:  c.ipAddress,
		Timestamp:  time.Now(),
		CPUUsage:   cpuPercent[0],
		RAMUsage:   memInfo.UsedPercent,
		DiskUsage:  diskInfo.UsedPercent,
	}, nil
}
