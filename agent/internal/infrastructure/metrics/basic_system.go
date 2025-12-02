package metrics

import (
	"time"

	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/disk"
	"github.com/shirou/gopsutil/v3/mem"
	"github.com/shirou/gopsutil/v3/net"

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
	cpuPerCore, err := cpu.Percent(0, true)
	if err != nil {
		// Log error but continue? Or return empty slice
		cpuPerCore = []float64{}
	}
	memInfo, err := mem.VirtualMemory()
	if err != nil {
		return domain.Metric{}, err
	}
	diskInfo, err := disk.Usage("/")
	if err != nil {
		return domain.Metric{}, err
	}

	netStats, err := net.IOCounters(false)
	var rx, tx uint64
	if err == nil && len(netStats) > 0 {
		rx = netStats[0].BytesRecv
		tx = netStats[0].BytesSent
	}

	return domain.Metric{
		DeviceName: c.deviceName,
		IpAddress:  c.ipAddress,
		Timestamp:  time.Now(),
		CPUUsage:   cpuPercent[0],
		CPUPerCore: cpuPerCore,
		RAMUsage:   memInfo.UsedPercent,
		RAMTotal:   memInfo.Total,
		RAMUsed:    memInfo.Used,
		RAMFree:    memInfo.Free,
		DiskUsage:  diskInfo.UsedPercent,
		DiskTotal:  diskInfo.Total,
		DiskUsed:   diskInfo.Used,
		DiskFree:   diskInfo.Free,
		NetRxBytes: rx,
		NetTxBytes: tx,
	}, nil
}
