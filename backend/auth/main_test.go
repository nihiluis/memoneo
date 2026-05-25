package main

import (
	"os"
	"path/filepath"
	"testing"
)

func TestLoadDotEnvMissingFileIsOptional(t *testing.T) {
	err := loadDotEnv(filepath.Join(t.TempDir(), ".env"))
	if err != nil {
		t.Fatalf("expected missing .env to be optional, got %v", err)
	}
}

func TestLoadDotEnvLoadsExistingFile(t *testing.T) {
	err := os.Unsetenv("MEMONEO_TEST_ENV")
	if err != nil {
		t.Fatalf("unset env var: %v", err)
	}
	t.Cleanup(func() {
		_ = os.Unsetenv("MEMONEO_TEST_ENV")
	})

	envPath := filepath.Join(t.TempDir(), ".env")
	err = os.WriteFile(envPath, []byte("MEMONEO_TEST_ENV=loaded\n"), 0o600)
	if err != nil {
		t.Fatalf("write env file: %v", err)
	}

	err = loadDotEnv(envPath)
	if err != nil {
		t.Fatalf("load env file: %v", err)
	}

	if got := os.Getenv("MEMONEO_TEST_ENV"); got != "loaded" {
		t.Fatalf("expected env var to be loaded, got %q", got)
	}
}
