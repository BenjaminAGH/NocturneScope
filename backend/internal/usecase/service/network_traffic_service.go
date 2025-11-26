package service

import (
	"github.com/BenjaminAGH/nocturnescope/backend/internal/domain"
)

type NetworkTrafficService struct {
	repo domain.NetworkTrafficRepository
}

func NewNetworkTrafficService(repo domain.NetworkTrafficRepository) *NetworkTrafficService {
	return &NetworkTrafficService{repo: repo}
}

func (s *NetworkTrafficService) ProcessTrafficData(deviceID uint, trafficData []domain.NetworkTraffic) error {
	// Assign DeviceID to all records
	for i := range trafficData {
		trafficData[i].DeviceID = deviceID
	}
	return s.repo.CreateBatch(trafficData)
}

func (s *NetworkTrafficService) GetByDeviceID(deviceID uint, limit int) ([]domain.NetworkTraffic, error) {
	return s.repo.FindByDeviceID(deviceID, limit)
}

func (s *NetworkTrafficService) GetByDeviceName(userID uint, deviceName string, limit int) ([]domain.NetworkTraffic, error) {
	return s.repo.FindByDeviceName(userID, deviceName, limit)
}
