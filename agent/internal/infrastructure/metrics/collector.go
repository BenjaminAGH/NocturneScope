package metrics

import "github.com/BenjaminAGH/nocturneagent/internal/domain"

type Collector interface {
	Collect() (domain.Metric, error)
}
