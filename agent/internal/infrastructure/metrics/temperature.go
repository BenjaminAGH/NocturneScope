package metrics

import (
	"github.com/shirou/gopsutil/v3/host"

	"github.com/BenjaminAGH/nocturneagent/internal/domain"
)

type TemperatureCollector struct{}

func NewTemperatureCollector() *TemperatureCollector {
	return &TemperatureCollector{}
}

func (c *TemperatureCollector) Collect() (domain.Metric, error) {
	temps, err := host.SensorsTemperatures()
	if err != nil {
		return domain.Metric{}, nil
	}

	if len(temps) == 0 {
		return domain.Metric{}, nil
	}


	t := temps[0]

	return domain.Metric{
		Temperature: t.Temperature,
	}, nil
}
