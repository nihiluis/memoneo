package configs

import "github.com/nihiluis/memoneo2/auth/internal/services/auth"

type TestConfigs struct{}

func (cfg *TestConfigs) Auth() (*auth.Config, error) {
	return &auth.Config{
		JWTSigningKey:    "",
		Kid:              "test",
		AuthCookieDomain: "",
	}, nil
}
