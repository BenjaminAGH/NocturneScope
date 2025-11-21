package service

import (
	"encoding/json"
	"errors"

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

	// Find Action Nodes
	var rules []domain.AlertRule
	for _, n := range flow.Nodes {
		if n.Type == "action" {
			// Find connected Device (input) and Email (output)
			deviceID := findSourceNodeID(flow.Edges, n.ID)
			emailID := findTargetNodeID(flow.Edges, n.ID)

			if deviceID == "" || emailID == "" {
				continue
			}

			deviceNode, ok1 := nodeMap[deviceID]
			emailNode, ok2 := nodeMap[emailID]

			if !ok1 || !ok2 || emailNode.Type != "email" {
				continue
			}

			// Extract device name from device node label or data
			// Assuming device node data has 'label' which is the device name
			deviceName, _ := deviceNode.Data["label"].(string)
			if deviceName == "" {
				continue
			}

			// Extract Action Data
			metric, _ := n.Data["metric"].(string)
			operator, _ := n.Data["operator"].(string)
			threshold, _ := n.Data["threshold"].(float64)

			// Extract Email Data
			emailTo, _ := emailNode.Data["to"].(string)
			subject, _ := emailNode.Data["subject"].(string)
			body, _ := emailNode.Data["body"].(string)

			if metric == "" || operator == "" || emailTo == "" {
				continue
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
			})
		}
	}

	s.alertService.UpdateRules(t.ID, rules)
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
