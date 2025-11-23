package service

import (
	"fmt"
	"log"
	"net/smtp"
	"os"
	"sync"
	"time"

	"github.com/BenjaminAGH/nocturnescope/backend/internal/domain"
)

type AlertService struct {
	mu           sync.RWMutex
	rules        map[uint][]domain.AlertRule // topologyID -> rules
	recentAlerts []alertRecord
	smtpHost     string
	smtpPort     string
	smtpUser     string
	smtpPassword string
	smtpFrom     string
}

type alertRecord struct {
	ruleID      string
	triggeredAt time.Time
}

func NewAlertService() *AlertService {
	return &AlertService{
		rules:        make(map[uint][]domain.AlertRule),
		recentAlerts: make([]alertRecord, 0),
		smtpHost:     os.Getenv("SMTP_HOST"),
		smtpPort:     os.Getenv("SMTP_PORT"),
		smtpUser:     os.Getenv("SMTP_USER"),
		smtpPassword: os.Getenv("SMTP_PASSWORD"),
		smtpFrom:     os.Getenv("SMTP_FROM"),
	}
}

func (s *AlertService) UpdateRules(topologyID uint, rules []domain.AlertRule) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.rules[topologyID] = rules
}

func (s *AlertService) Evaluate(metric domain.Metric) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	now := time.Now()

	for _, ruleSet := range s.rules {
		for _, rule := range ruleSet {
			if rule.DeviceID != metric.DeviceName {
				continue
			}

			var metricValue float64
			switch rule.Metric {
			case "cpu":
				metricValue = metric.CPUUsage
			case "ram":
				metricValue = metric.RAMUsage
			case "disk":
				metricValue = metric.DiskUsage
			case "temp":
				metricValue = metric.Temperature
			default:
				continue
			}

			triggered := false
			switch rule.Operator {
			case ">":
				triggered = metricValue > rule.Threshold
			case ">=":
				triggered = metricValue >= rule.Threshold
			case "<":
				triggered = metricValue < rule.Threshold
			case "<=":
				triggered = metricValue <= rule.Threshold
			case "==":
				triggered = metricValue == rule.Threshold
			}

			if triggered {
				// Check cooldown
				if !rule.LastTriggeredAt.IsZero() {
					cooldown, _ := time.ParseDuration(rule.Cooldown)
					if now.Sub(rule.LastTriggeredAt) < cooldown {
						continue
					}
				}

				// Update last triggered
				rule.LastTriggeredAt = now

				// Record alert
				s.recentAlerts = append(s.recentAlerts, alertRecord{
					ruleID:      rule.ID,
					triggeredAt: now,
				})

				// Send email if configured
				if rule.EmailTo != "" {
					go func(r domain.AlertRule) {
						if err := s.SendCustomEmail(r.EmailTo, r.EmailSubject, r.EmailBody); err != nil {
							log.Printf("Error sending alert email: %v", err)
						}
					}(rule)
				}
			}
		}
	}
}

func (s *AlertService) GetRecentAlerts(window time.Duration) []string {
	s.mu.RLock()
	defer s.mu.RUnlock()

	cutoff := time.Now().Add(-window)
	recent := make([]string, 0)

	for _, alert := range s.recentAlerts {
		if alert.triggeredAt.After(cutoff) {
			recent = append(recent, alert.ruleID)
		}
	}

	return recent
}

func (s *AlertService) SendTestEmail(toEmail string) error {
	subject := "NocturneScope Test Email"
	body := "This is a test email from NocturneScope. If you received this, your email configuration is working correctly."
	return s.SendCustomEmail(toEmail, subject, body)
}

func (s *AlertService) SendCustomEmail(toEmail, subject, body string) error {
	if s.smtpHost == "" || s.smtpPort == "" {
		return fmt.Errorf("SMTP not configured")
	}

	auth := smtp.PlainAuth("", s.smtpUser, s.smtpPassword, s.smtpHost)

	// Construct email with proper MIME headers
	from := s.smtpFrom
	if from == "" {
		from = s.smtpUser
	}

	headers := make(map[string]string)
	headers["From"] = from
	headers["To"] = toEmail
	headers["Subject"] = subject
	headers["MIME-Version"] = "1.0"
	headers["Content-Type"] = "text/plain; charset=\"utf-8\""

	message := ""
	for k, v := range headers {
		message += fmt.Sprintf("%s: %s\r\n", k, v)
	}
	message += "\r\n" + body

	addr := fmt.Sprintf("%s:%s", s.smtpHost, s.smtpPort)
	return smtp.SendMail(addr, auth, from, []string{toEmail}, []byte(message))
}
