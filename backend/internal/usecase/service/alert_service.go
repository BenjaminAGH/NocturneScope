package service

import (
	"crypto/tls"
	"fmt"
	"net/smtp"
	"os"
	"sync"
	"time"

	"github.com/BenjaminAGH/nocturnescope/backend/internal/domain"
)

type AlertService struct {
	rules      map[uint][]domain.AlertRule
	mu         sync.RWMutex
	smtpHost   string
	smtpPort   string
	smtpUser   string
	smtpPass   string
	lastSent   map[string]time.Time // Key: ruleID, Value: last sent time
	lastSentMu sync.Mutex
}

func NewAlertService() *AlertService {
	host := os.Getenv("SMTP_HOST")
	port := os.Getenv("SMTP_PORT")
	user := os.Getenv("SMTP_USER")
	pass := os.Getenv("SMTP_PASS")

	// Validate SMTP configuration
	if host != "" && port != "" && user != "" && pass != "" {
		fmt.Println("[AlertService] Validating SMTP configuration...")
		auth := smtp.PlainAuth("", user, pass, host)
		client, err := smtp.Dial(fmt.Sprintf("%s:%s", host, port))
		if err != nil {
			fmt.Printf("[AlertService] WARNING: Could not connect to SMTP server: %v\n", err)
		} else {
			if err = client.StartTLS(&tls.Config{ServerName: host}); err != nil {
				fmt.Printf("[AlertService] WARNING: Could not start TLS: %v\n", err)
			} else {
				if err = client.Auth(auth); err != nil {
					fmt.Printf("[AlertService] WARNING: SMTP Authentication failed: %v\n", err)
				} else {
					fmt.Println("[AlertService] SMTP Configuration Verified Successfully ✅")
					client.Quit()
				}
			}
		}
	} else {
		fmt.Println("[AlertService] SMTP configuration missing or incomplete. Email alerts will be disabled.")
	}

	return &AlertService{
		rules:    make(map[uint][]domain.AlertRule),
		smtpHost: host,
		smtpPort: port,
		smtpUser: user,
		smtpPass: pass,
		lastSent: make(map[string]time.Time),
	}
}

func (s *AlertService) UpdateRules(topologyID uint, rules []domain.AlertRule) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.rules[topologyID] = rules
	fmt.Printf("[AlertService] Updated rules for topology %d: %d rules active\n", topologyID, len(rules))
}

func (s *AlertService) Evaluate(m domain.Metric) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	for _, rules := range s.rules {
		for _, rule := range rules {
			if rule.DeviceID != m.DeviceName {
				continue
			}

			// Check if metric type matches (cpu, ram, etc.)
			// The metric struct usually has fields like CPU, RAM. We need to check the specific field.
			// Since domain.Metric is a struct, we might need to reflect or check based on the rule.Metric string.

			val := getMetricValue(m, rule.Metric)
			if val == -1 {
				continue // Metric not found or invalid
			}

			if checkThreshold(val, rule.Operator, rule.Threshold) {
				s.triggerAlert(rule, val)
			}
		}
	}
}

func getMetricValue(m domain.Metric, metricType string) float64 {
	switch metricType {
	case "cpu":
		return m.CPUUsage
	case "ram":
		return m.RAMUsage
	case "disk":
		return m.DiskUsage
	case "temp":
		return m.Temperature
	default:
		return -1
	}
}

func checkThreshold(val float64, op string, threshold float64) bool {
	switch op {
	case ">":
		return val > threshold
	case ">=":
		return val >= threshold
	case "<":
		return val < threshold
	case "<=":
		return val <= threshold
	case "==":
		return val == threshold
	default:
		return false
	}
}

func (s *AlertService) triggerAlert(rule domain.AlertRule, val float64) {
	s.lastSentMu.Lock()
	last, ok := s.lastSent[rule.ID]

	// Cooldown logic: Only send if never sent OR if 1 hour has passed since last email
	if ok && time.Since(last) < 1*time.Hour {
		s.lastSentMu.Unlock()
		return
	}

	s.lastSent[rule.ID] = time.Now()
	s.lastSentMu.Unlock()

	fmt.Printf("[AlertService] Triggering alert for rule %s: %s %s %f (Value: %f)\n", rule.ID, rule.Metric, rule.Operator, rule.Threshold, val)

	go s.sendEmail(rule, val)
}

func (s *AlertService) sendEmail(rule domain.AlertRule, val float64) {
	if s.smtpHost == "" || s.smtpUser == "" {
		return
	}

	auth := smtp.PlainAuth("", s.smtpUser, s.smtpPass, s.smtpHost)
	to := []string{rule.EmailTo}

	timestamp := time.Now().Format("2006-01-02 15:04:05")

	msg := []byte(fmt.Sprintf("To: %s\r\n"+
		"Subject: [NocturneScope Alert] %s\r\n"+
		"MIME-Version: 1.0\r\n"+
		"Content-Type: text/plain; charset=\"utf-8\"\r\n"+
		"\r\n"+
		"ALERT NOTIFICATION\r\n"+
		"==================\r\n"+
		"Time: %s\r\n"+
		"Device: %s\r\n"+
		"Metric: %s\r\n"+
		"Condition: %s %.2f\r\n"+
		"Current Value: %.2f\r\n"+
		"\r\n"+
		"Message:\r\n"+
		"%s\r\n"+
		"\r\n"+
		"--\r\n"+
		"NocturneScope Monitoring System\r\n",
		rule.EmailTo, rule.EmailSubject, timestamp, rule.DeviceID, rule.Metric, rule.Operator, rule.Threshold, val, rule.EmailBody))

	addr := fmt.Sprintf("%s:%s", s.smtpHost, s.smtpPort)
	err := smtp.SendMail(addr, auth, s.smtpUser, to, msg)
	if err != nil {
		fmt.Printf("[AlertService] Error sending email: %v\n", err)
	} else {
		fmt.Printf("[AlertService] Email sent to %s\n", rule.EmailTo)
	}
}
