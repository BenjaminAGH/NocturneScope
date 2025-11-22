package service

import (
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/BenjaminAGH/nocturnescope/backend/internal/domain"
)

type TopologyService struct {
	repo         domain.TopologyRepository
	alertService domain.AlertService
	debugLog     []string
}

func NewTopologyService(repo domain.TopologyRepository, alertService domain.AlertService) *TopologyService {
	return &TopologyService{
		repo:         repo,
		alertService: alertService,
	}
}

func (s *TopologyService) Save(userID uint, name string, data string) (*domain.Topology, error) {
	if !isValidJSON(data) {
		return nil, errors.New("invalid JSON data")
	}

	t := &domain.Topology{
		UserID: userID,
		Name:   name,
		Data:   data,
	}

	if err := s.repo.Create(t); err != nil {
		return nil, err
	}

	s.processRules(t)

	return t, nil
}

func (s *TopologyService) List(userID uint) ([]domain.Topology, error) {
	return s.repo.FindByUser(userID)
}

func (s *TopologyService) Get(id uint, userID uint) (*domain.Topology, error) {
	return s.repo.FindByID(id, userID)
}

func (s *TopologyService) Update(id uint, userID uint, name string, data string) (*domain.Topology, error) {
	if !isValidJSON(data) {
		return nil, errors.New("invalid JSON data")
	}

	existing, err := s.repo.FindByID(id, userID)
	if err != nil {
		return nil, err
	}

	existing.Name = name
	existing.Data = data

	if err := s.repo.Update(existing); err != nil {
		return nil, err
	}

	s.processRules(existing)

	return existing, nil
}

func (s *TopologyService) Delete(id uint, userID uint) error {
	// Also remove rules
	if s.alertService != nil {
		s.alertService.UpdateRules(id, nil)
	}
	return s.repo.Delete(id, userID)
}

func isValidJSON(str string) bool {
	var js interface{}
	return json.Unmarshal([]byte(str), &js) == nil
}

// --- Rule Extraction Logic ---

type FlowData struct {
	Nodes []Node `json:"nodes"`
	Edges []Edge `json:"edges"`
}
type Node struct {
	ID   string                 `json:"id"`
	Type string                 `json:"type"`
	Data map[string]interface{} `json:"data"`
}
type Edge struct {
	Source string `json:"source"`
	Target string `json:"target"`
}

func (s *TopologyService) processRules(t *domain.Topology) {
	if s.alertService == nil {
		return
	}

	var flow FlowData
	if err := json.Unmarshal([]byte(t.Data), &flow); err != nil {
		return
	}

	// Map nodes by ID for easy lookup
	nodeMap := make(map[string]Node)
	for _, n := range flow.Nodes {
		nodeMap[n.ID] = n
	}

	s.log(fmt.Sprintf("Processing topology %d. Nodes: %d, Edges: %d", t.ID, len(flow.Nodes), len(flow.Edges)))

	// Find Action Nodes
	var rules []domain.AlertRule
	for _, n := range flow.Nodes {
		if n.Type == "action" {
			s.log(fmt.Sprintf("Found Action Node: %s", n.ID))

			// Find connected Device (input) and Email (output)
			deviceID := findSourceNodeID(flow.Edges, n.ID)
			emailID := findTargetNodeID(flow.Edges, n.ID)

			s.log(fmt.Sprintf("Action %s connections - DeviceID: %s, EmailID: %s", n.ID, deviceID, emailID))

			if deviceID == "" || emailID == "" {
				s.log("Skipping action: missing input or output connection")
				continue
			}

			deviceNode, ok1 := nodeMap[deviceID]
			emailNode, ok2 := nodeMap[emailID]

			if !ok1 || !ok2 || emailNode.Type != "email" {
				s.log(fmt.Sprintf("Skipping action: Invalid nodes. DeviceFound: %v, EmailFound: %v, EmailNodeType: %s", ok1, ok2, emailNode.Type))
				continue
			}

			// Extract device name from device node label or data
			// Assuming device node data has 'label' which is the device name
			deviceName, _ := deviceNode.Data["label"].(string)
			// Also try 'deviceName' if 'label' is missing (DeviceNode uses 'deviceName')
			if deviceName == "" {
				deviceName, _ = deviceNode.Data["deviceName"].(string)
			}
			// Also try 'connectedDevice' if it's a MonitoringNode
			if deviceName == "" {
				deviceName, _ = deviceNode.Data["connectedDevice"].(string)
			}

			if deviceName == "" {
				s.log(fmt.Sprintf("Skipping action: Device name is empty for node %s. Data: %v", deviceNode.ID, deviceNode.Data))
				continue
			}

			// Extract Action Data
			metricRaw, _ := n.Data["metric"].(string)
			metric := strings.ToLower(metricRaw)
			if metric == "" {
				metric = "cpu" // Default
			}

			operator, _ := n.Data["operator"].(string)
			if operator == "" {
				operator = ">=" // Default
			}

			threshold, okThreshold := n.Data["threshold"].(float64)
			if !okThreshold {
				s.log(fmt.Sprintf("Warning: Threshold is not float64. Data: %v", n.Data["threshold"]))
				// Attempt to recover if it's int or string (though JSON unmarshal usually gives float64 for numbers)
				threshold = 70.0 // Default
			}

			// Extract Email Data
			s.log(fmt.Sprintf("Email Node Data: %v", emailNode.Data)) // Log full data
			emailTo, _ := emailNode.Data["to"].(string)
			subject, _ := emailNode.Data["subject"].(string)
			body, _ := emailNode.Data["body"].(string)
			cooldown, _ := emailNode.Data["cooldown"].(string)

			s.log(fmt.Sprintf("Extracted Data - Device: %s, Metric: %s, Op: %s, Threshold: %f, Email: %s", deviceName, metric, operator, threshold, emailTo))

			if emailTo == "" {
				s.log("Skipping action: EmailTo is empty. User must configure email recipient.")
				continue
			}

			if cooldown == "" {
				cooldown = "1h" // Default
			}

			rules = append(rules, domain.AlertRule{
				ID:           n.ID,
				TopologyID:   t.ID,
				DeviceID:     deviceName,
				Metric:       metric,
				Operator:     operator,
				Threshold:    threshold,
				EmailTo:      emailTo,
				EmailSubject: subject,
				EmailBody:    body,
				Cooldown:     cooldown,
			})
		}
	}

	s.alertService.UpdateRules(t.ID, rules)
}

func (s *TopologyService) LoadRules() error {
	if s.alertService == nil {
		return nil
	}

	topologies, err := s.repo.FindAll()
	if err != nil {
		return err
	}

	for _, t := range topologies {
		s.processRules(&t)
	}

	return nil
}

func findSourceNodeID(edges []Edge, targetID string) string {
	for _, e := range edges {
		if e.Target == targetID {
			return e.Source
		}
	}
	return ""
}

func findTargetNodeID(edges []Edge, sourceID string) string {
	for _, e := range edges {
		if e.Source == sourceID {
			return e.Target
		}
	}
	return ""
}

func (s *TopologyService) GetDebugLog() []string {
	return s.debugLog
}

func (s *TopologyService) log(msg string) {
	s.debugLog = append(s.debugLog, fmt.Sprintf("[%s] %s", time.Now().Format("15:04:05"), msg))
	// Keep log size manageable
	if len(s.debugLog) > 100 {
		s.debugLog = s.debugLog[len(s.debugLog)-100:]
	}
	fmt.Println(msg)
}
