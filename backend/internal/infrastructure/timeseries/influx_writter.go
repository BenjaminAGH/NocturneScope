package timeseries

import (
	"context"
	"time"

	influxdb2 "github.com/influxdata/influxdb-client-go/v2"
	"github.com/influxdata/influxdb-client-go/v2/api"

	"github.com/BenjaminAGH/nocturnescope/backend/internal/domain"
)

type InfluxWriter struct {
	client influxdb2.Client
	org    string
	bucket string
	write  api.WriteAPIBlocking
}

func NewInfluxWriter(url, token, org, bucket string) *InfluxWriter {
	c := influxdb2.NewClient(url, token)
	return &InfluxWriter{
		client: c,
		org:    org,
		bucket: bucket,
		write:  c.WriteAPIBlocking(org, bucket),
	}
}

func (w *InfluxWriter) Client() influxdb2.Client { return w.client }
func (w *InfluxWriter) Org() string              { return w.org }
func (w *InfluxWriter) Bucket() string           { return w.bucket }

func (w *InfluxWriter) Close() { if w.client != nil { w.client.Close() } }

func (w *InfluxWriter) WriteMetric(m domain.Metric) error {
	if w == nil || w.client == nil || w.write == nil {
		return nil
	}

	ts := m.Timestamp
	if ts.IsZero() {
		ts = time.Now().UTC()
	}

	tags := map[string]string{
		"device": m.DeviceName,
		"ip":     m.IpAddress,
	}
	if m.OS != "" {
		tags["os"] = m.OS
	}
	if m.DeviceType != "" {
		tags["type"] = m.DeviceType
	}

	fields := map[string]interface{}{}

	if m.CPUUsage != 0 {
		fields["cpu"] = m.CPUUsage
	}
	if m.RAMUsage != 0 {
		fields["ram"] = m.RAMUsage
	}
	if m.DiskUsage != 0 {
		fields["disk"] = m.DiskUsage
	}

	if m.NetRxBytes != 0 {
		fields["net_rx"] = float64(m.NetRxBytes)
	}
	if m.NetTxBytes != 0 {
		fields["net_tx"] = float64(m.NetTxBytes)
	}
	if m.Temperature != 0 {
		fields["temp"] = m.Temperature
	}
	if m.UptimeSec != 0 {
		fields["uptime"] = float64(m.UptimeSec)
	}

	// if len(m.CPUPerCore) > 0 {
	// 	for i, v := range m.CPUPerCore {
	// 		fields[fmt.Sprintf("cpu_core_%d", i)] = v
	// 	}
	// }

	if len(fields) == 0 {
		return nil
	}

	p := influxdb2.NewPoint("system_metrics", tags, fields, ts)
	return w.write.WritePoint(context.Background(), p)
}
