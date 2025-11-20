package service

import (
	"encoding/json"
	"errors"

	"github.com/BenjaminAGH/nocturnescope/backend/internal/domain"
)

type TopologyService struct {
	repo domain.TopologyRepository
}

func NewTopologyService(repo domain.TopologyRepository) *TopologyService {
	return &TopologyService{repo: repo}
}

func (s *TopologyService) Save(userID uint, name string, data string) (*domain.Topology, error) {
	// Validar que data sea JSON válido
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

	return t, nil
}

func (s *TopologyService) List(userID uint) ([]domain.Topology, error) {
	return s.repo.FindByUser(userID)
}

func (s *TopologyService) Get(id uint, userID uint) (*domain.Topology, error) {
	return s.repo.FindByID(id, userID)
}

func (s *TopologyService) Update(id uint, userID uint, name string, data string) (*domain.Topology, error) {
	// Validar que data sea JSON válido
	if !isValidJSON(data) {
		return nil, errors.New("invalid JSON data")
	}

	// Verificar que existe
	existing, err := s.repo.FindByID(id, userID)
	if err != nil {
		return nil, err
	}

	existing.Name = name
	existing.Data = data

	if err := s.repo.Update(existing); err != nil {
		return nil, err
	}

	return existing, nil
}

func (s *TopologyService) Delete(id uint, userID uint) error {
	return s.repo.Delete(id, userID)
}

func isValidJSON(str string) bool {
	var js interface{}
	return json.Unmarshal([]byte(str), &js) == nil
}
