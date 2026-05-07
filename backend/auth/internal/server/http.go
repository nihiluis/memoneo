package server

import (
	"fmt"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/nihiluis/memoneo2/auth/internal/logger"
	"go.uber.org/zap"
)

type Config struct {
	Port         string
	AllowOrigins []string
}

type EchoServer struct {
	Echo   *echo.Echo
	Config *Config
}

func NewEchoService(logger *logger.Logger, config *Config) (*EchoServer, error) {
	e := echo.New()
	e.HideBanner = true
	e.HidePort = true
	e.HTTPErrorHandler = func(err error, c echo.Context) {
		logger.Zap.Errorw("error during handler",
			zap.String("path", c.Path()),
			"params", c.QueryParams(),
			zap.String("err", err.Error()))

		e.DefaultHTTPErrorHandler(err, c)
	}

	e.Use(middleware.Recover())
	e.Use(middleware.Gzip())

	return &EchoServer{Echo: e, Config: config}, nil
}

func (server *EchoServer) Start() {
	server.Echo.Start(fmt.Sprintf(":%s", server.Config.Port))
}
