package api

import (
	"crypto/rsa"
	"net/http"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
	"github.com/nihiluis/memoneo2/auth/internal/logger"
)

func userCookieAuth(logger *logger.Logger) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			req := c.Request()
			if req.Header.Get("Authorization") != "" {
				return next(c)
			}

			cookie, err := c.Cookie("token")
			if err != nil || cookie.Value == "" {
				return next(c)
			}

			req.Header.Set("Authorization", "Bearer "+cookie.Value)
			return next(c)
		}
	}
}

func jwtAuth(publicKey *rsa.PublicKey, logger *logger.Logger) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			authHeader := c.Request().Header.Get("Authorization")
			const prefix = "Bearer "
			if len(authHeader) <= len(prefix) || authHeader[:len(prefix)] != prefix {
				return c.JSON(http.StatusUnauthorized, echo.Map{"message": "token is invalid"})
			}

			token, err := jwt.Parse(authHeader[len(prefix):], func(token *jwt.Token) (interface{}, error) {
				return publicKey, nil
			}, jwt.WithValidMethods([]string{jwt.SigningMethodRS256.Alg()}))
			if err != nil || !token.Valid {
				if err != nil {
					logger.Zap.Debugw("Unable to verify token", "errMessage", err.Error())
				}
				return c.JSON(http.StatusUnauthorized, echo.Map{"message": "token is invalid"})
			}

			c.Set("user", token)
			return next(c)
		}
	}
}
