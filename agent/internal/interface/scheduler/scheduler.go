package scheduler

import (
	"time"
	"github.com/BenjaminAGH/nocturneagent/internal/usecase/collect"
)

func Start(svc *collect.Service, interval time.Duration) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	svc.RunOnce()
	for range ticker.C {
		svc.RunOnce()
	}
}
