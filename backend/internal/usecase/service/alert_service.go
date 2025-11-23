package service

import (
	"fmt"
	"sync"
	"time"

	"github.com/BenjaminAGH/nocturnescope/backend/internal/domain"
	"github.com/BenjaminAGH/nocturnescope/backend/internal/infrastructure/email"
)

type AlertServiceImpl struct {
	mu              sync.RWMutex
	rules           map[uint][]domain.AlertRule // topologyID -> rules
	recentAlerts    []string
	recentTimestamp time.Time
	emailService    *email.EmailService
}

func NewAlertService(emailService *email.EmailService) *AlertServiceImpl {
	return &AlertServiceImpl{
		rules:        make(map[uint][]domain.AlertRule),
		recentAlerts: []string{},
		emailService: emailService,
	}
}

func (s *AlertServiceImpl) UpdateRules(topologyID uint, rules []domain.AlertRule) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.rules[topologyID] = rules
}

func (s *AlertServiceImpl) Evaluate(metric domain.Metric) {
	s.mu.Lock()
	defer s.mu.Unlock()

	now := time.Now()

	// Iterate through all rules
	for _, ruleList := range s.rules {
		for i := range ruleList {
			rule := &ruleList[i]

			// Check if this rule applies to this device
			if rule.DeviceID != metric.DeviceName {
				continue
			}

			// Get the metric value
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

			// Evaluate the condition
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

			if !triggered {
				continue
			}

			// Check cooldown
			cooldownDuration, err := time.ParseDuration(rule.Cooldown)
			if err != nil {
				cooldownDuration = 5 * time.Minute // default
			}

			if now.Sub(rule.LastTriggeredAt) < cooldownDuration {
				continue
			}

			// Trigger alert
			rule.LastTriggeredAt = now
			s.recentAlerts = append(s.recentAlerts, rule.ID)
			s.recentTimestamp = now

			// Send email if configured
			if rule.EmailTo != "" && s.emailService != nil {
				subject := rule.EmailSubject
				if subject == "" {
					subject = fmt.Sprintf("Alert: %s %s %.2f on %s", rule.Metric, rule.Operator, rule.Threshold, rule.DeviceID)
				}

				body := rule.EmailBody
				if body == "" {
					body = fmt.Sprintf("Alert triggered:\nDevice: %s\nMetric: %s\nCondition: %s %.2f\nCurrent Value: %.2f\nTime: %s",
						rule.DeviceID, rule.Metric, rule.Operator, rule.Threshold, metricValue, now.Format(time.RFC3339))
				}

				go func(to, subj, bd string) {
					if err := s.emailService.SendEmail(to, subj, bd); err != nil {
						fmt.Printf("Failed to send alert email: %v\n", err)
					}
				}(rule.EmailTo, subject, body)
			}
		}
	}
}

func (s *AlertServiceImpl) GetRecentAlerts(window time.Duration) []string {
	s.mu.RLock()
	defer s.mu.RUnlock()

	if time.Since(s.recentTimestamp) > window {
		return []string{}
	}

	return s.recentAlerts
}

func (s *AlertServiceImpl) SendTestEmail(toEmail string) error {
	if s.emailService == nil {
		return fmt.Errorf("email service not configured")
	}

	subject := "Test Email from NocturneScope"
	body := "This is a test email to verify your email configuration is working correctly."

	return s.emailService.SendEmail(toEmail, subject, body)
}

func (s *AlertServiceImpl) SendCustomEmail(toEmail, subject, body string) error {
	if s.emailService == nil {
		return fmt.Errorf("email service not configured")
	}

	if subject == "" {
		subject = "Alert from NocturneScope"
	}

	if body == "" {
		body = "An alert condition has been triggered."
	}

	return s.emailService.SendEmail(toEmail, subject, body)
}
