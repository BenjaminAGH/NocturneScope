package cli

import (
	"fmt"

	"github.com/charmbracelet/bubbles/textinput"
	tea "github.com/charmbracelet/bubbletea"

	"github.com/BenjaminAGH/nocturneagent/config"
)

type step int

const (
	stepBackend step = iota
	stepToken
	stepInterval
	stepDeviceType
	stepDone
)

type setupModel struct {
	step   step
	input  textinput.Model
	cfg    config.AgentConfig
	err    error
	done   bool
	saveOK bool
}

func NewSetupModel() setupModel {
	ti := textinput.New()
	ti.Placeholder = "http://localhost:3000"
	ti.Focus()
	ti.CharLimit = 256
	ti.Width = 40

	return setupModel{
		step:  stepBackend,
		input: ti,
		cfg: config.AgentConfig{
			Interval: "10s",
		},
	}
}

func (m setupModel) Init() tea.Cmd {
	return textinput.Blink
}

func (m setupModel) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {

	case tea.KeyMsg:
		switch msg.Type {
		case tea.KeyCtrlC, tea.KeyEsc:
			return m, tea.Quit
		case tea.KeyEnter:
			return m.handleEnter()
		}

	case error:
		m.err = msg
		return m, nil
	}

	var cmd tea.Cmd
	m.input, cmd = m.input.Update(msg)
	return m, cmd
}

func (m setupModel) View() string {
	if m.done {
		if m.saveOK {
			return "✅ Configuración guardada en ~/.nocturneagent/config.json\n"
		}
		return fmt.Sprintf("❌ Error guardando: %v\n", m.err)
	}

	label := ""
	switch m.step {
	case stepBackend:
		label = "Backend URL:"
	case stepToken:
		label = "API Token (ntk_...):"
	case stepInterval:
		label = "Intervalo (ej 10s):"
	case stepDeviceType:
		label = "Tipo de dispositivo (SERVER/WORKSTATION):"
	}

	return fmt.Sprintf("%s\n\n%s\n\n(enter para continuar, esc para salir)\n", label, m.input.View())
}

func (m setupModel) handleEnter() (tea.Model, tea.Cmd) {
	val := m.input.Value()

	switch m.step {
	case stepBackend:
		m.cfg.BackendURL = val
		m.step = stepToken
		m.input.SetValue("")
		m.input.Placeholder = "ntk_..."
	case stepToken:
		m.cfg.APIToken = val
		m.step = stepInterval
		m.input.SetValue(m.cfg.Interval)
		m.input.Placeholder = "10s"
	case stepInterval:
		if val != "" {
			m.cfg.Interval = val
		}
		m.step = stepDeviceType
		m.input.SetValue("")
		m.input.Placeholder = "SERVER"
	case stepDeviceType:
		m.cfg.DeviceType = val
		// guardar
		err := config.Save(m.cfg)
		m.done = true
		if err != nil {
			m.saveOK = false
			m.err = err
		} else {
			m.saveOK = true
		}
		return m, tea.Quit
	}

	return m, nil
}
