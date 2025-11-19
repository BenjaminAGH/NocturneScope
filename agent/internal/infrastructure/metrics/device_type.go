package metrics

import "github.com/BenjaminAGH/nocturneagent/internal/domain"

type DeviceTypeCollector struct {
	deviceType string
}

func NewDeviceTypeCollector(deviceType string) *DeviceTypeCollector {
	return &DeviceTypeCollector{deviceType: deviceType}
}

func (c *DeviceTypeCollector) Collect() (domain.Metric, error) {
	if c.deviceType == "" {
		return domain.Metric{}, nil
	}
	return domain.Metric{
		DeviceType: c.deviceType,
	}, nil
}
