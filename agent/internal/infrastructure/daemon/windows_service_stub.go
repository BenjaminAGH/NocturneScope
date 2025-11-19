//go:build !windows

package daemon

// en linux/macos solo definimos la función para que exista
func InstallWindows(binPath string) error {
	return nil
}
