package domain

import "time"

type AlertRule struct {
	ID              string
	TopologyID      uint
	DeviceID        string // The device name/ID to monitor
	Metric          string // cpu, ram, disk, temp
	Operator        string // >, >=, <, <=, ==
	Threshold       float64
	EmailTo         string
	EmailSubject    string
	EmailBody       string
	Cooldown        string // e.g., "5m", "1h"
	LastTriggeredAt time.Time
}

type AlertService interface {
	UpdateRules(topologyID uint, rules []AlertRule)
	Evaluate(metric Metric)
}
