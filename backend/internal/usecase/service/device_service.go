package service

import "github.com/BenjaminAGH/nocturnescope/backend/internal/domain"

type DeviceService struct {
	repo domain.DeviceRepository
}

func NewDeviceService(repo domain.DeviceRepository) *DeviceService {
	return &DeviceService{repo: repo}
}

func (s *DeviceService) Register(name string) error {
	if name == "" {
		return nil
	}
	return s.repo.Register(name)
}

func (s *DeviceService) List() ([]domain.Device, error) {
	return s.repo.List()
}

func (s *DeviceService) Delete(name string) error {
	return s.repo.Delete(name)
}
