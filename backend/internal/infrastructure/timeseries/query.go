package timeseries

import (
	"context"

	influxdb2 "github.com/influxdata/influxdb-client-go/v2"
	"github.com/influxdata/influxdb-client-go/v2/api"
)

type InfluxQuery struct {
	Client influxdb2.Client
	Org    string
	Bucket string
}

func NewInfluxQuery(client influxdb2.Client, org, bucket string) *InfluxQuery {
	return &InfluxQuery{Client: client, Org: org, Bucket: bucket}
}

func (q *InfluxQuery) Query(ctx context.Context, flux string) (*api.QueryTableResult, error) {
	apiq := q.Client.QueryAPI(q.Org)
	return apiq.Query(ctx, flux)
}

func durOrDefault(s, def string) string {
	if s == "" {
		return def
	}
	return s
}

func aggOrDefault(s, def string) string {
	switch s {
	case "mean", "min", "max", "last", "sum":
		return s
	default:
		if def == "" {
			return "mean"
		}
		return def
	}
}

func intervalOrDefault(s, def string) string {
	if s == "" {
		return def
	}
	return s
}
