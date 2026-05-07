package logger

import "go.uber.org/zap"

type Logger struct {
	Zap *zap.SugaredLogger
}

func NewService() *Logger {
	zapLogger, _ := zap.NewDevelopment()
	return &Logger{Zap: zapLogger.Sugar()}
}
