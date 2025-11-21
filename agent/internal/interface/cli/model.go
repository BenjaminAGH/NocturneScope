package cli

import (
	"fmt"
	"os"
	"runtime"
	"time"

	"github.com/charmbracelet/bubbles/textinput"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"

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
	stateInstall
	stateDone
)

// Styles
var (
	docStyle = lipgloss.NewStyle().
			Margin(1, 2).
			Border(lipgloss.RoundedBorder()).
			BorderForeground(lipgloss.Color("63")).
			Padding(1, 2).
			Width(60)

	titleStyle = lipgloss.NewStyle().
			Foreground(lipgloss.Color("#FAFAFA")).
			Background(lipgloss.Color("#7D56F4")).
			Padding(0, 1).
			Bold(true).
			MarginBottom(1)

	itemStyle = lipgloss.NewStyle().
			PaddingLeft(2)

	selectedItemStyle = lipgloss.NewStyle().
				PaddingLeft(2).
				Foreground(lipgloss.Color("205")).
				Bold(true).
				Border(lipgloss.NormalBorder(), false, false, false, true).
				BorderForeground(lipgloss.Color("205"))

	labelStyle = lipgloss.NewStyle().
			Foreground(lipgloss.Color("241")).
			MarginTop(1)

	metricLabelStyle = lipgloss.NewStyle().
				Foreground(lipgloss.Color("99")).
				Width(12)

	metricValueStyle = lipgloss.NewStyle().
				Foreground(lipgloss.Color("205")).
				Bold(true)

	helpStyle = lipgloss.NewStyle().
			Foreground(lipgloss.Color("241")).
			MarginTop(2).
			Italic(true)

	errorStyle = lipgloss.NewStyle().
			Foreground(lipgloss.Color("#FF0000")).
			Bold(true)

	successStyle = lipgloss.NewStyle().
			Foreground(lipgloss.Color("#00FF00")).
			Bold(true)
)

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
		state:     st,
		setupStep: stepBackend,
		input:     ti,
		cfg:       cfg,
		metricsC:  mc,
		options: []string{
			"Ver última métrica",
			"Reconfigurar todo",
			"Instalar como servicio del sistema",
			"Resetear configuración",
			"Salir",
		},
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

	case installMsg:
		if msg.err == nil {
			m.installStatus = "✅ Servicio instalado correctamente. El agente se reiniciará automáticamente."
		} else {
			m.installStatus = fmt.Sprintf("❌ Error instalando servicio: %v", msg.err)
		}
		return m, nil

	case tea.KeyMsg:
		switch msg.String() {
		case "ctrl+c":
			m.exitAndKeepAgent = false
			return m, tea.Quit

		case "up", "k":
			if m.state == stateMenu {
				if m.cursor > 0 {
					m.cursor--
				}
			}

		case "down", "j":
			if m.state == stateMenu {
				if m.cursor < len(m.options)-1 {
					m.cursor++
				}
			}

		case "b":
			if m.state == stateRealtime || m.state == stateInstall {
				m.state = stateMenu
				return m, nil
			}

		case "enter":
			if m.state == stateMenu {
				switch m.cursor {
				case 0: // Ver última métrica
					m.state = stateRealtime
					return m, listenMetric(m.metricsC)
				case 1: // Reconfigurar
					m.state = stateSetup
					m.setupStep = stepBackend
					m.input.SetValue(m.cfg.BackendURL)
					m.input.Placeholder = "http://localhost:3000"
					return m, nil
				case 2: // Instalar servicio
					m.state = stateInstall
					m.installStatus = "⏳ Instalando servicio..."
					return m, installServiceCmd
				case 3: // Resetear
					_ = config.Delete()
					m.exitAndKeepAgent = false
					return m, tea.Quit
				case 4: // Salir
					m.exitAndKeepAgent = false
					return m, tea.Quit
				}
			} else if m.state == stateSetup {
				return m.handleSetupEnter()
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
	var content string

	switch m.state {
	case stateSetup:
		label := ""
		switch m.setupStep {
		case stepBackend:
			label = "Backend URL"
		case stepToken:
			label = "API Token"
		case stepInterval:
			label = "Intervalo"
		case stepDeviceType:
			label = "Tipo de Dispositivo"
		}

		header := titleStyle.Render("Configuración Inicial")
		subHeader := lipgloss.NewStyle().Foreground(lipgloss.Color("205")).Render(label)

		content = lipgloss.JoinVertical(lipgloss.Left,
			header,
			subHeader,
			"",
			m.input.View(),
			helpStyle.Render("Enter: Confirmar • Esc: Salir"),
		)

	case stateMenu:
		header := titleStyle.Render("Nocturne Agent")

		var optionsView string
		for i, choice := range m.options {
			var item string
			if m.cursor == i {
				item = selectedItemStyle.Render(choice)
			} else {
				item = itemStyle.Render(choice)
			}
			optionsView += item + "\n"
		}

		content = lipgloss.JoinVertical(lipgloss.Left,
			header,
			optionsView,
			helpStyle.Render("↑/↓: Navegar • Enter: Seleccionar"),
		)

	case stateRealtime:
		header := titleStyle.Render("Monitor en Tiempo Real")

		rows := []string{
			renderMetricRow("Device", m.lastM.DeviceName),
			renderMetricRow("OS", m.lastM.OS),
			renderMetricRow("CPU", fmt.Sprintf("%.2f%%", m.lastM.CPUUsage)),
			renderMetricRow("RAM", fmt.Sprintf("%.2f%%", m.lastM.RAMUsage)),
			renderMetricRow("Disk", fmt.Sprintf("%.2f%%", m.lastM.DiskUsage)),
			renderMetricRow("Temp", fmt.Sprintf("%.1f°C", m.lastM.Temperature)),
			renderMetricRow("Net RX", fmt.Sprintf("%d B", m.lastM.NetRxBytes)),
			renderMetricRow("Net TX", fmt.Sprintf("%d B", m.lastM.NetTxBytes)),
		}

		stats := lipgloss.JoinVertical(lipgloss.Left, rows...)

		content = lipgloss.JoinVertical(lipgloss.Left,
			header,
			stats,
			helpStyle.Render("b: Volver al menú"),
		)

	case stateInstall:
		header := titleStyle.Render("Instalación de Servicio")
		status := m.installStatus
		if status == "" {
			status = "Iniciando..."
		}

		content = lipgloss.JoinVertical(lipgloss.Left,
			header,
			"",
			status,
			helpStyle.Render("b: Volver al menú"),
		)

	case stateDone:
		return "Saliendo..."
	}

	return docStyle.Render(content)
}

func renderMetricRow(label, value string) string {
	return fmt.Sprintf("%s %s", metricLabelStyle.Render(label+":"), metricValueStyle.Render(value))
}

// paso a paso del setup inicial
func (m Model) handleSetupEnter() (Model, tea.Cmd) {
	val := m.input.Value()

	switch m.setupStep {
	case stepBackend:
		m.cfg.BackendURL = val
		m.setupStep = stepToken
		m.input.SetValue(m.cfg.APIToken) // Pre-fill if exists
		m.input.Placeholder = "ntk_..."
		return m, nil

	case stepToken:
		m.cfg.APIToken = val
		m.setupStep = stepInterval
		if m.cfg.Interval == "" {
			m.cfg.Interval = "10s"
		}
		m.input.SetValue(m.cfg.Interval)
		m.input.Placeholder = "10s"
		return m, nil

	case stepInterval:
		if val != "" {
			m.cfg.Interval = val
		}
		m.setupStep = stepDeviceType
		if m.cfg.DeviceType == "" {
			m.cfg.DeviceType = "SERVER"
		}
		m.input.SetValue(m.cfg.DeviceType)
		m.input.Placeholder = "SERVER"
		return m, nil

	case stepDeviceType:
		m.cfg.DeviceType = val
		_ = config.Save(m.cfg)
		m.state = stateMenu
		return m, nil
	}

	return m, nil
}

// mensaje interno para nuevas métricas
type metricMsg domain.Metric

type installMsg struct{ err error }

type setupStep int

const (
	stepBackend setupStep = iota
	stepToken
	stepInterval
	stepDeviceType
)

type Model struct {
	state            state
	setupStep        setupStep
	input            textinput.Model
	cfg              config.AgentConfig
	metricsC         <-chan domain.Metric // lo manda el agente
	lastM            domain.Metric
	err              error
	installStatus    string
	exitAndKeepAgent bool // el main lo consulta
	cursor           int
	options          []string
}

// listenMetric devuelve un cmd que espera una métrica del canal
func listenMetric(c <-chan domain.Metric) tea.Cmd {
	return func() tea.Msg {
		m := <-c
		return metricMsg(m)
	}
}

func installServiceCmd() tea.Msg {
	// Wait a bit to show the UI
	time.Sleep(1 * time.Second)

	if runtime.GOOS == "windows" {
		// En Windows, usamos el binario actual
		exe, _ := os.Executable()
		err := daemon.InstallWindows(exe)
		return installMsg{err: err}
	}

	if runtime.GOOS == "linux" {
		err := daemon.InstallSystemd()
		return installMsg{err: err}
	}

	return installMsg{err: fmt.Errorf("sistema operativo no soportado: %s", runtime.GOOS)}
}

// el main lo usa para saber si debe quedarse con select {}
func (m Model) ShouldKeepRunning() bool {
	return m.exitAndKeepAgent
}
