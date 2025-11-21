package service

import (
	"context"
	"fmt"
	"time"

	"github.com/influxdata/influxdb-client-go/v2/api"

	"github.com/BenjaminAGH/nocturnescope/backend/internal/domain"
	"github.com/BenjaminAGH/nocturnescope/backend/internal/infrastructure/timeseries"
)

type MetricService struct {
	writer       *timeseries.InfluxWriter
	alertService domain.AlertService
}

func NewMetricService(writer *timeseries.InfluxWriter, alertService domain.AlertService) *MetricService {
	return &MetricService{
		writer:       writer,
		alertService: alertService,
	}
}

func (s *MetricService) Store(m domain.Metric) error {
	if s.alertService != nil {
		go s.alertService.Evaluate(m)
	}

	if s.writer == nil {
		fmt.Println("[metrics] Influx no configurado, métrica descartada")
		return nil
	}
	return s.writer.WriteMetric(m)
}

func (s *MetricService) ListDevices(ctx context.Context) ([]string, error) {
	q, err := s.queryAPI()
	if err != nil {
		return nil, err
	}

	flux := fmt.Sprintf(`
from(bucket: "%s")
  |> range(start: -30d)
  |> filter(fn: (r) => r._measurement == "system_metrics")
  |> keep(columns: ["device"])
  |> distinct(column: "device")
  |> sort(columns: ["device"])
`, s.writer.Bucket())

	res, err := q.Query(ctx, flux)
	if err != nil {
		return nil, err
	}
	defer res.Close()

	var devices []string
	for res.Next() {
		if v, ok := res.Record().ValueByKey("device").(string); ok && v != "" {
			devices = append(devices, v)
		}
	}
	return devices, res.Err()
}

// LastStats retorna el último valor conocido de cada métrica para un dispositivo.
func (s *MetricService) LastStats(ctx context.Context, device string) (map[string]interface{}, error) {
	q, err := s.queryAPI()
	if err != nil {
		return nil, err
	}

	fields := []string{"cpu", "ram", "disk", "net_rx", "net_tx", "temp", "uptime"}

	flux := fmt.Sprintf(`
from(bucket: "%[1]s")
  |> range(start: -24h)
  |> filter(fn: (r) => r._measurement == "system_metrics" and r.device == "%[2]s")
  |> filter(fn: (r) => contains(value: r._field, set: %[3]s))
  |> last()
  |> pivot(rowKey:["_time"], columnKey:["_field"], valueColumn:"_value")
  |> group()
  |> keep(columns: ["_time","cpu","ram","disk","net_rx","net_tx","temp","uptime","os","ip","gateway"])
`, s.writer.Bucket(), device, fieldsToFluxArray(fields))

	res, err := q.Query(ctx, flux)
	if err != nil {
		return nil, err
	}
	defer res.Close()

	out := map[string]interface{}{}
	for res.Next() {
		rec := res.Record()

		// Tags (strings)
		if v, ok := rec.ValueByKey("os").(string); ok {
			out["os"] = v
		}
		if v, ok := rec.ValueByKey("ip").(string); ok {
			out["ip"] = v
		}
		if v, ok := rec.ValueByKey("gateway").(string); ok {
			out["gateway"] = v
		}

		// Fields (floats)
		for _, k := range fields {
			if v := rec.ValueByKey(k); v != nil {
				if f, ok := toFloat(v); ok {
					out[k] = f
				}
			}
		}
	}
	return out, res.Err()
}

// Point es el punto de serie temporal para el frontend.
type Point struct {
	T time.Time `json:"t"`
	V float64   `json:"v"`
}

// TimeSeries retorna una serie temporal para un `field` dado, con rango/agg/interval configurables.
func (s *MetricService) TimeSeries(ctx context.Context, device, field, rangeDur, agg, interval string) ([]Point, error) {
	q, err := s.queryAPI()
	if err != nil {
		return nil, err
	}

	r := durOrDefault(rangeDur, "1h")
	a := aggOrDefault(agg, "mean")
	every := intervalOrDefault(interval, "1m")

	fn := "mean"
	switch a {
	case "min":
		fn = "min"
	case "max":
		fn = "max"
	case "last":
		fn = "last"
	case "sum":
		fn = "sum"
	}

	flux := fmt.Sprintf(`
from(bucket: "%s")
  |> range(start: -%s)
  |> filter(fn: (r) => r._measurement == "system_metrics" and r.device == "%s" and r._field == "%s")
  |> aggregateWindow(every: %s, fn: %s, createEmpty: false)
  |> keep(columns: ["_time","_value"])
`, s.writer.Bucket(), r, device, field, every, fn)

	res, err := q.Query(ctx, flux)
	if err != nil {
		return nil, err
	}
	defer res.Close()

	out := []Point{}
	for res.Next() {
		rec := res.Record()
		if f, ok := toFloat(rec.Value()); ok {
			out = append(out, Point{T: rec.Time(), V: f})
		}
	}
	return out, res.Err()
}

// History retorna los últimos N registros para un dispositivo.
func (s *MetricService) History(ctx context.Context, device, rangeDur string) ([]map[string]interface{}, error) {
	q, err := s.queryAPI()
	if err != nil {
		return nil, err
	}

	r := durOrDefault(rangeDur, "1h")
	fields := []string{"cpu", "ram", "disk", "net_rx", "net_tx", "temp", "uptime"}

	flux := fmt.Sprintf(`
from(bucket: "%[1]s")
  |> range(start: -%[2]s)
  |> filter(fn: (r) => r._measurement == "system_metrics" and r.device == "%[3]s")
  |> filter(fn: (r) => contains(value: r._field, set: %[4]s))
  |> pivot(rowKey:["_time"], columnKey:["_field"], valueColumn:"_value")
  |> keep(columns: ["_time","cpu","ram","disk","net_rx","net_tx","temp","uptime"])
  |> sort(columns: ["_time"], desc: true)
  |> limit(n: 100)
`, s.writer.Bucket(), r, device, fieldsToFluxArray(fields))

	res, err := q.Query(ctx, flux)
	if err != nil {
		return nil, err
	}
	defer res.Close()

	out := make([]map[string]interface{}, 0)
	for res.Next() {
		rec := res.Record()
		row := map[string]interface{}{
			"time": rec.Time(),
		}
		for _, k := range fields {
			if v := rec.ValueByKey(k); v != nil {
				if f, ok := toFloat(v); ok {
					row[k] = f
				}
			}
		}
		out = append(out, row)
	}
	return out, res.Err()
}

// ====== Helpers internos ======

func (s *MetricService) queryAPI() (api.QueryAPI, error) {
	if s.writer == nil || s.writer.Client() == nil || s.writer.Org() == "" || s.writer.Bucket() == "" {
		return nil, fmt.Errorf("influx query no inicializado")
	}
	return s.writer.Client().QueryAPI(s.writer.Org()), nil
}

func toFloat(v any) (float64, bool) {
	switch x := v.(type) {
	case float64:
		return x, true
	case float32:
		return float64(x), true
	case int64:
		return float64(x), true
	case int32:
		return float64(x), true
	case int:
		return float64(x), true
	default:
		return 0, false
	}
}

func fieldsToFluxArray(fields []string) string {
	out := "["
	for i, f := range fields {
		if i > 0 {
			out += ","
		}
		out += `"` + f + `"`
	}
	out += "]"
	return out
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
