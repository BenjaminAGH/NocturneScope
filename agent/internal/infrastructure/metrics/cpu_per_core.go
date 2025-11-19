package metrics

import (
	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/BenjaminAGH/nocturneagent/internal/domain"
)

type CPUPerCoreCollector struct{}

func NewCPUPerCoreCollector() *CPUPerCoreCollector {
	return &CPUPerCoreCollector{}
}

func (c *CPUPerCoreCollector) Collect() (domain.Metric, error) {
	percent, err := cpu.Percent(0, true)
	if err != nil {
		return domain.Metric{}, err
	}
	return domain.Metric{
		CPUPerCore: percent,
	}, nil
}
