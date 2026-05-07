package datastore

import (
	"fmt"
	"strings"
)

type Config struct {
	Host      string
	Port      string
	Driver    string
	StoreName string
	Username  string
	Password  string
	SSLMode   string
}

func (cfg *Config) ConnURL() string {
	sslMode := strings.TrimSpace(cfg.SSLMode)
	if sslMode == "" {
		sslMode = "disable"
	}

	return fmt.Sprintf(
		"%s://%s:%s@%s:%s/%s?sslmode=%s",
		cfg.Driver,
		cfg.Username,
		cfg.Password,
		cfg.Host,
		cfg.Port,
		cfg.StoreName,
		sslMode,
	)
}
