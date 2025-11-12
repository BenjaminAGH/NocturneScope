package database

import (
	"log"
	"os"

	"github.com/BenjaminAGH/nocturnescope/backend/internal/infrastructure/timeseries"
)

func NewInfluxFromEnv() *timeseries.InfluxWriter {
	url := os.Getenv("INFLUX_URL")
	token := os.Getenv("INFLUX_TOKEN")
	org := os.Getenv("INFLUX_ORG")
	bucket := os.Getenv("INFLUX_BUCKET")

	if url == "" || token == "" || org == "" || bucket == "" {
		log.Println("influx: vars incompletas, no se inicializa InfluxWriter")
		return nil
	}

	return timeseries.NewInfluxWriter(url, token, org, bucket)
}
