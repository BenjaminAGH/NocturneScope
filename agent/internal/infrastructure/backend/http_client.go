package backend

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/BenjaminAGH/nocturneagent/internal/domain"
)

type HTTPClient struct {
	baseURL string
	token   string
	client  *http.Client

	queue       chan domain.Metric
	maxRetries  int
	backoffBase time.Duration
	silent      bool
}

type Option func(*HTTPClient)

func WithQueue(size int) Option {
	return func(c *HTTPClient) {
		c.queue = make(chan domain.Metric, size)
	}
}

func WithRetry(max int, base time.Duration) Option {
	return func(c *HTTPClient) {
		c.maxRetries = max
		c.backoffBase = base
	}
}

func WithSilent(silent bool) Option {
	return func(c *HTTPClient) {
		c.silent = silent
	}
}

func NewHTTPClient(baseURL, token string, opts ...Option) *HTTPClient {
	// Normalize baseURL to remove trailing slash
	if len(baseURL) > 0 && baseURL[len(baseURL)-1] == '/' {
		baseURL = baseURL[:len(baseURL)-1]
	}

	c := &HTTPClient{
		baseURL:     baseURL,
		token:       token,
		client:      &http.Client{Timeout: 5 * time.Second},
		queue:       make(chan domain.Metric, 100), // por defecto 100 en cola
		maxRetries:  3,
		backoffBase: time.Second,
	}
	for _, o := range opts {
		o(c)
	}

	// lanzamos el worker que vacía la cola
	go c.worker()

	if !c.silent {
		fmt.Printf("🔗 HTTP Client initialized: %s (token: %s...)\n", baseURL, token[:min(8, len(token))])
	}

	return c
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// este es el método que usa el caso de uso
func (c *HTTPClient) SendMetric(m domain.Metric) error {
	if c.baseURL == "" || c.baseURL == "/" {
		return fmt.Errorf("backend no configurado")
	}

	// intento inmediato
	if err := c.sendOnce(m); err != nil {
		// si falla, lo mandamos a la cola
		select {
		case c.queue <- m:
			if !c.silent {
				fmt.Println("backend no disponible, métrica encolada")
			}
		default:
			if !c.silent {
				fmt.Println("cola llena, se descarta métrica")
			}
		}
		return err
	}
	return nil
}

// worker que reintenta lo que quedó en la cola
func (c *HTTPClient) worker() {
	for m := range c.queue {
		ok := c.retrySend(m)
		if !ok {
			if !c.silent {
				fmt.Println("no se pudo enviar métrica después de reintentos, se descarta")
			}
		}
	}
}

// retry con backoff exponencial simple
func (c *HTTPClient) retrySend(m domain.Metric) bool {
	for i := 0; i < c.maxRetries; i++ {
		if err := c.sendOnce(m); err == nil {
			return true
		}
		sleep := c.backoffBase * (1 << i) // 1s, 2s, 4s...
		time.Sleep(sleep)
	}
	return false
}

// hace el HTTP real
func (c *HTTPClient) sendOnce(m domain.Metric) error {
	body, err := json.Marshal(m)
	if err != nil {
		return err
	}

	url := c.baseURL + "/api/metrics"
	req, err := http.NewRequest(http.MethodPost, url, bytes.NewBuffer(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	if c.token != "" {
		req.Header.Set("X-API-Key", c.token)
	}

	resp, err := c.client.Do(req)
	if err != nil {
		if !c.silent {
			fmt.Println("error enviando métrica:", err)
		}
		return err
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)

	if resp.StatusCode >= 300 {
		if !c.silent {
			fmt.Printf("backend respondió %d: %s\n", resp.StatusCode, string(respBody))
		}
		return fmt.Errorf("backend status %d", resp.StatusCode)
	}

	if !c.silent {
		fmt.Printf("✅ Métrica enviada exitosamente (device: %s)\n", m.DeviceName)
	}
	return nil
}
