package configs

import (
	"testing"
	"time"
)

func TestSessionTTL(t *testing.T) {
	for _, tc := range []struct {
		value string
		want  time.Duration
	}{{"", 72 * time.Hour}, {"168h", 168 * time.Hour}, {"1m", time.Minute}} {
		t.Run(tc.value, func(t *testing.T) {
			t.Setenv("AUTH_TOKEN_TTL", tc.value)
			if got := NewService().Auth().SessionTTL(); got != tc.want {
				t.Fatalf("got %s, want %s", got, tc.want)
			}
		})
	}
}
func TestSessionTTLRejectsInvalidValues(t *testing.T) {
	for _, value := range []string{"wrong", "0h", "-1h", "30s"} {
		t.Run(value, func(t *testing.T) {
			t.Setenv("AUTH_TOKEN_TTL", value)
			defer func() {
				if recover() == nil {
					t.Fatal("expected invalid TTL to fail startup")
				}
			}()
			NewService().Auth()
		})
	}
}
