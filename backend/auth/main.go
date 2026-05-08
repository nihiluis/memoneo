package main

import (
	"context"

	"github.com/joho/godotenv"
	_ "github.com/nihiluis/memoneo2/auth/docs"
	"github.com/nihiluis/memoneo2/auth/internal/api"
	"github.com/nihiluis/memoneo2/auth/internal/configs"
	"github.com/nihiluis/memoneo2/auth/internal/datastore"
	"github.com/nihiluis/memoneo2/auth/internal/logger"
	"github.com/nihiluis/memoneo2/auth/internal/migrations"
	"github.com/nihiluis/memoneo2/auth/internal/server"
	postgresauth "github.com/nihiluis/memoneo2/auth/internal/services/auth/postgres"
	"github.com/nihiluis/memoneo2/auth/internal/services/enckeys"
	"go.uber.org/zap"
)

// @title Memoneo Auth API
// @version 0.0.0
// @description Memoneo authentication and encrypted key API.
// @BasePath /
// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
func main() {
	err := godotenv.Load(".env")
	if err != nil {
		panic(err)
	}

	logger := logger.NewService()
	configs := configs.NewService()

	pgConfig := configs.Datastore()
	authConfig := configs.Auth()
	httpConfig := configs.HTTP()
	apiConfig := configs.API()

	datastore, err := datastore.NewService(pgConfig)
	if err != nil {
		logger.Zap.Panicw("Unable to load postgres data", zap.Error(err))
	}
	defer datastore.DB.Close()

	if err := datastore.RunMigrations(context.Background(), migrations.Migrations); err != nil {
		logger.Zap.Panicw("Unable to run auth migrations", zap.Error(err))
	}

	authService, err := postgresauth.NewService(logger, datastore, authConfig)
	if err != nil {
		logger.Zap.Panicw("Unable to load auth service", zap.Error(err))
	}

	enckeys, err := enckeys.NewService(logger, datastore)
	if err != nil {
		logger.Zap.Panicw("Unable to load enckeys service", zap.Error(err))
	}

	server, err := server.NewEchoService(logger, httpConfig)
	if err != nil {
		logger.Zap.Panicw("Unable to load http server", zap.Error(err))
	}

	api, err := api.NewService(logger, authService, apiConfig, authConfig, enckeys)
	if err != nil {
		logger.Zap.Panicw("Unable to load api service", zap.Error(err))
	}
	api.AddHandlers(server)

	logger.Zap.Info("Loaded all services")
	logger.Zap.Infow("HTTP server starting", zap.String("port", httpConfig.Port))

	server.Start()
}
