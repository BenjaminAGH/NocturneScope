package main

import (
	"fmt"
	"log"

	"github.com/shirou/gopsutil/v3/disk"
)

func main() {
	fmt.Println("Debugging Disk Partitions...")

	// 1. Get Partitions (all=false)
	partitions, err := disk.Partitions(false)
	if err != nil {
		log.Fatalf("Error getting partitions (false): %v", err)
	}
	fmt.Printf("Found %d partitions (all=false):\n", len(partitions))
	for _, p := range partitions {
		fmt.Printf("  - Device: %s, Mount: %s, Fstype: %s\n", p.Device, p.Mountpoint, p.Fstype)
		u, err := disk.Usage(p.Mountpoint)
		if err != nil {
			fmt.Printf("    Error getting usage: %v\n", err)
		} else {
			fmt.Printf("    Usage: Total=%d, Used=%d, Free=%d, Percent=%.2f%%\n", u.Total, u.Used, u.Free, u.UsedPercent)
		}
	}

	// 2. Get Partitions (all=true)
	partitionsAll, err := disk.Partitions(true)
	if err != nil {
		log.Fatalf("Error getting partitions (true): %v", err)
	}
	fmt.Printf("\nFound %d partitions (all=true):\n", len(partitionsAll))
	// Just print count to avoid spam if too many
}
