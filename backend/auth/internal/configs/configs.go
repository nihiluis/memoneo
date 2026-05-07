package configs

import (
	"os"
	"strings"

	"github.com/nihiluis/memoneo2/auth/internal/api"
	"github.com/nihiluis/memoneo2/auth/internal/datastore"
	"github.com/nihiluis/memoneo2/auth/internal/server"
	"github.com/nihiluis/memoneo2/auth/internal/services/auth"
)

// Configs struct handles all dependencies required for handling configurations
type Configs struct {
}

// HTTP returns the configuration required for HTTP package
func (cfg *Configs) HTTP() *server.Config {
	allowOrigins := []string{"http://localhost:3000", "http://localhost:3001", "http://localhost:3333"}

	allowOrigins = append(allowOrigins, strings.Split(os.Getenv("ALLOW_ORIGINS"), "|")...)

	return &server.Config{
		Port:         os.Getenv("PORT"),
		AllowOrigins: allowOrigins,
	}
}

// API returns API configuration
func (cfg *Configs) API() *api.Config {
	return &api.Config{
		UserIDContextKey: "dataUserID",
	}
}

// Auth returns the configuration for the general auth package.
func (cfg *Configs) Auth() *auth.Config {
	kid := os.Getenv("AUTH_JWT_KID")
	if kid == "" {
		kid = os.Getenv("AUTH_KID")
	}
	if kid == "" {
		kid = "memoneo-auth"
	}

	return &auth.Config{
		JWTSigningKey:    os.Getenv("AUTH_JWT_SIGNING_KEY"),
		Kid:              kid,
		AuthCookieDomain: os.Getenv("AUTH_COOKIE_DOMAIN"),
	}
}

// Datastore returns datastore configuration
func (cfg *Configs) Datastore() *datastore.Config {
	return &datastore.Config{
		Host:   os.Getenv("DB_HOST"),
		Port:   os.Getenv("DB_PORT"),
		Driver: "postgres",

		StoreName: os.Getenv("DB_STORE"), // archstack
		Username:  os.Getenv("DB_USER"),
		Password:  os.Getenv("DB_PASSWORD"),

		SSLMode: os.Getenv("DB_SSL_MODE"),
	}
}

// NewService returns an instance of Config with all the required dependencies initialized
func NewService() *Configs {
	return &Configs{}
}
