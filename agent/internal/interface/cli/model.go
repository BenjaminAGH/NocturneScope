package cli

import (
	"fmt"
	"os"
	"runtime"

	"github.com/charmbracelet/bubbles/textinput"
	tea "github.com/charmbracelet/bubbletea"

	"github.com/BenjaminAGH/nocturneagent/config"
	"github.com/BenjaminAGH/nocturneagent/internal/domain"
	"github.com/BenjaminAGH/nocturneagent/internal/infrastructure/daemon"
)

type state int

const (
	stateSetup state = iota
	stateMenu
	stateRealtime
	stateEdit
	stateDone
)

// mensaje interno para nuevas métricas
type metricMsg domain.Metric

type Model struct {
	state            state
	input            textinput.Model
	cfg              config.AgentConfig
	metricsC         <-chan domain.Metric // lo manda el agente
	lastM            domain.Metric
	err              error
	exitAndKeepAgent bool // el main lo consulta
}

// firstRun = true si no había config
func NewModel(cfg config.AgentConfig, mc <-chan domain.Metric, firstRun bool) Model {
	ti := textinput.New()
	ti.Focus()
	ti.Width = 40

	st := stateMenu
	if firstRun {
		st = stateSetup
		ti.Placeholder = "http://localhost:3000"
	}

	return Model{
		state:    st,
		input:    ti,
		cfg:      cfg,
		metricsC: mc,
	}
}

func (m Model) Init() tea.Cmd {
	// no escuchamos métricas hasta que el usuario lo pida
	return textinput.Blink
}

func (m Model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {

	case metricMsg:
		// solo deberíamos llegar aquí cuando estamos en stateRealtime
		m.lastM = domain.Metric(msg)
		if m.state == stateRealtime {
			return m, listenMetric(m.metricsC)
		}
		return m, nil

	case tea.KeyMsg:
		switch msg.String() {
		case "ctrl+c":
			m.exitAndKeepAgent = false
			return m, tea.Quit

		case "x":
			// salir de todo
			m.exitAndKeepAgent = false
			return m, tea.Quit

		case "1":
			if m.state == stateMenu {
				m.state = stateRealtime
				// ahora sí escuchamos
				return m, listenMetric(m.metricsC)
			}

		case "2":
			if m.state == stateMenu {
				m.state = stateEdit
				m.input.SetValue(m.cfg.BackendURL)
				m.input.Placeholder = "backend url"
				return m, nil
			}

		case "3":
			exe, _ := os.Executable()
			if runtime.GOOS == "windows" {
				err := daemon.InstallWindows(exe)
				if err != nil {
					m.err = err
				}
			} else {
				_ = daemon.StartDetachedAgent()
			}
			m.exitAndKeepAgent = false
			return m, tea.Quit

		case "4":
			_ = config.Delete()
			m.exitAndKeepAgent = false
			return m, tea.Quit

		case "b":
			m.state = stateMenu
			return m, nil

		case "enter":
			if m.state == stateSetup {
				return m.handleSetupEnter()
			}
			if m.state == stateEdit {
				m.cfg.BackendURL = m.input.Value()
				_ = config.Save(m.cfg)
				m.state = stateMenu
				return m, nil
			}
		}

	case error:
		m.err = msg
		return m, nil
	}

	// actualizar input si estamos en setup o edit
	var cmd tea.Cmd
	m.input, cmd = m.input.Update(msg)
	return m, cmd
}

func (m Model) View() string {
	switch m.state {
	case stateSetup:
		return fmt.Sprintf("Configurar agente\n\n%s\n\n(enter para continuar)", m.input.View())

	case stateMenu:
		return "NocturneAgent\n\n" +
			"1) Ver última métrica\n" +
			"2) Editar configuración\n" +
			"3) Cerrar TUI y dejar agente en segundo plano\n" +
			"4) Resetear configuración (borrar y salir)\n" +
			"x) Salir completamente\n"

	case stateRealtime:
		return fmt.Sprintf(
			"Última métrica (b para volver)\n\ndevice: %s\ncpu: %.2f\nram: %.2f\ndisk: %.2f\nos: %s\ntemp: %.1f\nrx: %d\ntx: %d\n",
			m.lastM.DeviceName,
			m.lastM.CPUUsage,
			m.lastM.RAMUsage,
			m.lastM.DiskUsage,
			m.lastM.OS,
			m.lastM.Temperature,
			m.lastM.NetRxBytes,
			m.lastM.NetTxBytes,
		)

	case stateEdit:
		return fmt.Sprintf("Editar backend URL\n\n%s\n\nenter para guardar, b para volver", m.input.View())

	case stateDone:
		return "Saliendo de TUI...\n"
	}

	return ""
}

// paso a paso del setup inicial
func (m Model) handleSetupEnter() (Model, tea.Cmd) {
	val := m.input.Value()

	if m.cfg.BackendURL == "" {
		m.cfg.BackendURL = val
		m.input.SetValue("")
		m.input.Placeholder = "ntk_..."
		return m, nil
	}
	if m.cfg.APIToken == "" {
		m.cfg.APIToken = val
		m.input.SetValue("10s")
		m.input.Placeholder = "intervalo"
		return m, nil
	}
	if m.cfg.Interval == "" {
		m.cfg.Interval = val
		m.input.SetValue("SERVER")
		m.input.Placeholder = "device_type"
		return m, nil
	}

	// último paso
	_ = config.Save(m.cfg)
	m.state = stateMenu
	return m, nil
}

// listenMetric devuelve un cmd que espera una métrica del canal
func listenMetric(c <-chan domain.Metric) tea.Cmd {
	return func() tea.Msg {
		m := <-c
		return metricMsg(m)
	}
}

// el main lo usa para saber si debe quedarse con select {}
func (m Model) ShouldKeepRunning() bool {
	return m.exitAndKeepAgent
}
