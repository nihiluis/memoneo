package migrations

import (
	"context"

	"github.com/uptrace/bun"
	"github.com/uptrace/bun/migrate"
)

var Migrations = migrate.NewMigrations()

func init() {
	Migrations.MustRegister(initSchema, dropSchema)
}

func initSchema(ctx context.Context, db *bun.DB) error {
	statements := []string{
		`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`,
		`CREATE TABLE IF NOT EXISTS users (
			id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
			mail text NOT NULL UNIQUE,
			password_hash text NOT NULL,
			first_name text,
			last_name text,
			created_at timestamptz DEFAULT now(),
			updated_at timestamptz DEFAULT now()
		)`,
		`CREATE TABLE IF NOT EXISTS enckeys (
			user_id uuid PRIMARY KEY,
			key text,
			salt text,
			created_at timestamptz DEFAULT now()
		)`,
	}

	for _, statement := range statements {
		if _, err := db.NewRaw(statement).Exec(ctx); err != nil {
			return err
		}
	}

	return nil
}

func dropSchema(ctx context.Context, db *bun.DB) error {
	statements := []string{
		`DROP TABLE IF EXISTS enckeys`,
		`DROP TABLE IF EXISTS users`,
		`DROP EXTENSION IF EXISTS "uuid-ossp"`,
	}

	for _, statement := range statements {
		if _, err := db.NewRaw(statement).Exec(ctx); err != nil {
			return err
		}
	}

	return nil
}
