package datastore

import (
	"context"
	"database/sql"
	"os"
	"strings"

	"github.com/uptrace/bun"
	"github.com/uptrace/bun/dialect/pgdialect"
	"github.com/uptrace/bun/driver/pgdriver"
	"github.com/uptrace/bun/migrate"
)

type Datastore struct {
	DB *bun.DB
}

func NewService(cfg *Config) (*Datastore, error) {
	databaseURL := strings.TrimSpace(os.Getenv("DATABASE_URL"))
	if databaseURL == "" {
		databaseURL = cfg.ConnURL()
	}

	sqlDB := sql.OpenDB(pgdriver.NewConnector(pgdriver.WithDSN(databaseURL)))
	db := bun.NewDB(sqlDB, pgdialect.New())

	if err := db.Ping(); err != nil {
		_ = db.Close()
		return nil, err
	}

	return &Datastore{DB: db}, nil
}

func (datastore *Datastore) RunMigrations(ctx context.Context, migrations *migrate.Migrations) error {
	migrator := migrate.NewMigrator(datastore.DB, migrations)
	if err := migrator.Init(ctx); err != nil {
		return err
	}

	_, err := migrator.Migrate(ctx)
	return err
}
