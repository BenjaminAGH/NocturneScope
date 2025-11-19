package daemon

import (
	"os"
	"os/exec"
	"runtime"
)

func StartDetachedAgent() error {
	exe, err := os.Executable()
	if err != nil {
		return err
	}

	cmd := exec.Command(exe, "agent")

	cmd.Stdout = nil
	cmd.Stderr = nil

	if runtime.GOOS != "windows" {
		cmd.SysProcAttr = getSysProcAttr()
	}

	return cmd.Start()
}
