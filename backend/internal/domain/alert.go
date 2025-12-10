package domain

import "time"

type AlertRule struct {
	ID              string
	TopologyID      uint
	UserID          uint   // Owner of the rule
	DeviceID        string // The device name/ID to monitor
	Metric          string // cpu, ram, disk, temp
	Operator        string // >, >=, <, <=, ==
	Threshold       float64
	EmailTo         string
	EmailSubject    string
	EmailBody       string
	Cooldown        string // e.g., "5m", "1h"
	ActionType      string // "email", "notification"
	NotificationMsg string // Message for notification
	LastTriggeredAt time.Time
}

type AlertService interface {
	UpdateRules(topologyID uint, rules []AlertRule)
	Evaluate(metric Metric)
	GetRecentAlerts(window time.Duration) []string
	SendTestEmail(toEmail string) error

	SendCustomEmail(toEmail, subject, body string) error
	GetNotifications(userID uint, limit int) ([]Notification, error)
	MarkNotificationAsRead(id, userID uint) error
}
