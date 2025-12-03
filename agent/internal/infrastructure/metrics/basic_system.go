package metrics

import (
	"log"
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

	netStats, err := net.IOCounters(false)
	var rx, tx uint64
	if err == nil && len(netStats) > 0 {
		rx = netStats[0].BytesRecv
		tx = netStats[0].BytesSent
	}

	// Disk Partitions
	partitions, err := disk.Partitions(false)
	if err != nil {
		log.Printf("Error getting partitions: %v", err)
	}
	diskPartitions := make(map[string]domain.DiskStat)
	for _, p := range partitions {
		u, err := disk.Usage(p.Mountpoint)
		if err == nil {
			diskPartitions[p.Mountpoint] = domain.DiskStat{
				Total:       u.Total,
				Used:        u.Used,
				Free:        u.Free,
				UsedPercent: u.UsedPercent,
			}
		} else {
			log.Printf("Error getting usage for %s: %v", p.Mountpoint, err)
		}
	}
	if len(diskPartitions) == 0 {
		log.Println("No partitions found or all failed.")
	} else {
		// log.Printf("Collected %d partitions", len(diskPartitions))
	}

	// Calculate total disk usage from partitions
	var totalDisk, usedDisk, freeDisk uint64
	for _, p := range diskPartitions {
		totalDisk += p.Total
		usedDisk += p.Used
		freeDisk += p.Free
	}

	// Avoid division by zero
	var usedPercent float64
	if totalDisk > 0 {
		usedPercent = (float64(usedDisk) / float64(totalDisk)) * 100.0
	}

	return domain.Metric{
		DeviceName:     c.deviceName,
		IpAddress:      c.ipAddress,
		Timestamp:      time.Now(),
		CPUUsage:       cpuPercent[0],
		CPUPerCore:     cpuPerCore,
		RAMUsage:       memInfo.UsedPercent,
		RAMTotal:       memInfo.Total,
		RAMUsed:        memInfo.Used,
		RAMFree:        memInfo.Free,
		DiskUsage:      usedPercent,
		DiskTotal:      totalDisk,
		DiskUsed:       usedDisk,
		DiskFree:       freeDisk,
		NetRxBytes:     rx,
		NetTxBytes:     tx,
		DiskPartitions: diskPartitions,
	}, nil
}
