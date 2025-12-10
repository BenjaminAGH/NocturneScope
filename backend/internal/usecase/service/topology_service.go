package service

import (
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"github.com/BenjaminAGH/nocturnescope/backend/internal/domain"
)

type TopologyService struct {
	repo         domain.TopologyRepository
	alertService domain.AlertService
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

			// Find connected Device (input) and Output (Email OR Notification)
			deviceID := findSourceNodeID(flow.Edges, n.ID)
			outputID := findTargetNodeID(flow.Edges, n.ID)

			s.log(fmt.Sprintf("Action %s connections - DeviceID: %s, OutputID: %s", n.ID, deviceID, outputID))

			if deviceID == "" || outputID == "" {
				s.log("Skipping action: missing input or output connection")
				continue
			}

			deviceNode, ok1 := nodeMap[deviceID]
			outputNode, ok2 := nodeMap[outputID]

			if !ok1 || !ok2 {
				s.log(fmt.Sprintf("Skipping action: Invalid nodes. DeviceFound: %v, OutputFound: %v", ok1, ok2))
				continue
			}

			// Validate Output Node Type
			if outputNode.Type != "email" && outputNode.Type != "notification" {
				s.log(fmt.Sprintf("Skipping action: Invalid output node type: %s", outputNode.Type))
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

			// Extract Output Data
			var emailTo, subject, body, notificationMsg, cooldown string
			var actionType string

			if outputNode.Type == "email" {
				actionType = "email"
				s.log(fmt.Sprintf("Email Node Data: %v", outputNode.Data))
				emailTo, _ = outputNode.Data["to"].(string)
				subject, _ = outputNode.Data["subject"].(string)
				body, _ = outputNode.Data["body"].(string)
				cooldown, _ = outputNode.Data["cooldown"].(string)

				if emailTo == "" {
					s.log("Skipping action: EmailTo is empty. User must configure email recipient.")
					continue
				}
			} else if outputNode.Type == "notification" {
				actionType = "notification"
				s.log(fmt.Sprintf("Notification Node Data: %v", outputNode.Data))
				notificationMsg, _ = outputNode.Data["message"].(string)
				// Notification nodes might not have cooldown in UI yet, defaulting or checking data
				// If NotificationNode doesn't have cooldown, we can default it or add it to the node later.
				// For now, let's look for "cooldown" in data just in case.
				cooldown, _ = outputNode.Data["cooldown"].(string)
			}

			if cooldown == "" {
				cooldown = "1h" // Default
			}

			s.log(fmt.Sprintf("Extracted Data - Device: %s, Metric: %s, Op: %s, Threshold: %f, Action: %s", deviceName, metric, operator, threshold, actionType))

			rules = append(rules, domain.AlertRule{
				ID:              n.ID,
				TopologyID:      t.ID,
				UserID:          t.UserID,
				DeviceID:        deviceName,
				Metric:          metric,
				Operator:        operator,
				Threshold:       threshold,
				EmailTo:         emailTo,
				EmailSubject:    subject,
				EmailBody:       body,
				NotificationMsg: notificationMsg,
				ActionType:      actionType,
				Cooldown:        cooldown,
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

func (s *TopologyService) log(msg string) {
	fmt.Println(msg)
}
