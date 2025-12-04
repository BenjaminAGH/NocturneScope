package service

import (
	"github.com/BenjaminAGH/nocturnescope/backend/internal/domain"
)

type DeviceGroupService struct {
	repo      domain.DeviceGroupRepository
	tokenRepo domain.APITokenRepository
}

func NewDeviceGroupService(repo domain.DeviceGroupRepository, tokenRepo domain.APITokenRepository) *DeviceGroupService {
	return &DeviceGroupService{repo: repo, tokenRepo: tokenRepo}
}

func (s *DeviceGroupService) Create(userID uint, name, description string) (*domain.DeviceGroup, error) {
	group := &domain.DeviceGroup{
		UserID:      userID,
		Name:        name,
		Description: description,
	}
	if err := s.repo.Create(group); err != nil {
		return nil, err
	}
	return group, nil
}

func (s *DeviceGroupService) GetByID(id uint, userID uint) (*domain.DeviceGroup, error) {
	return s.repo.FindByID(id, userID)
}

func (s *DeviceGroupService) ListByUser(userID uint) ([]domain.DeviceGroup, error) {
	return s.repo.FindByUser(userID)
}

func (s *DeviceGroupService) Update(id uint, userID uint, name, description string) error {
	group := &domain.DeviceGroup{
		ID:          id,
		UserID:      userID,
		Name:        name,
		Description: description,
	}
	return s.repo.Update(group)
}

func (s *DeviceGroupService) Delete(id uint, userID uint) error {
	// First revoke all tokens associated with this group
	if err := s.tokenRepo.RevokeByGroup(id); err != nil {
		return err
	}
	return s.repo.Delete(id, userID)
}
