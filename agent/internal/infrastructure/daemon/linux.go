package daemon

import (
	"os"
	"os/exec"
)

const serviceFile = `/etc/systemd/system/nocturneagent.service`

func InstallSystemd(binPath string) error {
	unit := `[Unit]
Description=Nocturne Agent
After=network.target

[Service]
ExecStart=` + binPath + ` agent
Restart=always

[Install]
WantedBy=multi-user.target
`
	if err := os.WriteFile(serviceFile, []byte(unit), 0644); err != nil {
		return err
	}

	// systemctl daemon-reload
	if err := exec.Command("systemctl", "daemon-reload").Run(); err != nil {
		return err
	}
	// systemctl enable --now ...
	if err := exec.Command("systemctl", "enable", "--now", "nocturneagent").Run(); err != nil {
		return err
	}

	return nil
}
