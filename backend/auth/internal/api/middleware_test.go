package api

import (
	"crypto/rand"
	"crypto/rsa"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gofrs/uuid/v5"
	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
	"github.com/nihiluis/memoneo2/auth/internal/logger"
)

func TestJWTAUTHRequiresIssuerAndAudience(t *testing.T) {
	privateKey := generateMiddlewareTestKey(t)
	e := echo.New()
	authMiddleware := jwtAuth(&privateKey.PublicKey, "memoneo-auth-test", "memoneo-test", logger.NewService())

	status := runAuthMiddleware(t, e, authMiddleware, signMiddlewareToken(t, privateKey, "memoneo-auth-test", "memoneo-test"))
	if status != http.StatusOK {
		t.Fatalf("expected valid token to pass, got status %d", status)
	}

	status = runAuthMiddleware(t, e, authMiddleware, signMiddlewareToken(t, privateKey, "memoneo-auth-test", "other-audience"))
	if status != http.StatusUnauthorized {
		t.Fatalf("expected wrong audience to fail, got status %d", status)
	}

	status = runAuthMiddleware(t, e, authMiddleware, signMiddlewareToken(t, privateKey, "other-issuer", "memoneo-test"))
	if status != http.StatusUnauthorized {
		t.Fatalf("expected wrong issuer to fail, got status %d", status)
	}
}

func TestCookieAuthOnlyPromotesCookieForSafeMethods(t *testing.T) {
	e := echo.New()
	cookieMiddleware := userCookieAuth(logger.NewService())

	getReq := httptest.NewRequest(http.MethodGet, "/auth", nil)
	getReq.AddCookie(&http.Cookie{Name: "token", Value: "cookie-token"})
	getRec := httptest.NewRecorder()
	getContext := e.NewContext(getReq, getRec)
	if err := cookieMiddleware(assertAuthorizationHeader(t, "Bearer cookie-token"))(getContext); err != nil {
		t.Fatalf("GET cookie auth failed: %v", err)
	}

	postReq := httptest.NewRequest(http.MethodPost, "/auth/password", nil)
	postReq.AddCookie(&http.Cookie{Name: "token", Value: "cookie-token"})
	postRec := httptest.NewRecorder()
	postContext := e.NewContext(postReq, postRec)
	if err := cookieMiddleware(assertAuthorizationHeader(t, ""))(postContext); err != nil {
		t.Fatalf("POST cookie auth failed: %v", err)
	}
}

func runAuthMiddleware(
	t *testing.T,
	e *echo.Echo,
	middleware echo.MiddlewareFunc,
	token string,
) int {
	t.Helper()

	req := httptest.NewRequest(http.MethodGet, "/auth", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	rec := httptest.NewRecorder()
	context := e.NewContext(req, rec)

	handler := middleware(func(c echo.Context) error {
		return c.NoContent(http.StatusOK)
	})
	if err := handler(context); err != nil {
		t.Fatalf("middleware returned error: %v", err)
	}
	return rec.Code
}

func assertAuthorizationHeader(t *testing.T, expected string) echo.HandlerFunc {
	t.Helper()

	return func(c echo.Context) error {
		if got := c.Request().Header.Get("Authorization"); got != expected {
			t.Fatalf("expected Authorization %q, got %q", expected, got)
		}
		return c.NoContent(http.StatusOK)
	}
}

func generateMiddlewareTestKey(t *testing.T) *rsa.PrivateKey {
	t.Helper()

	privateKey, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatalf("generate RSA key: %v", err)
	}
	return privateKey
}

func signMiddlewareToken(t *testing.T, privateKey *rsa.PrivateKey, issuer string, audience string) string {
	t.Helper()

	token, err := jwt.NewWithClaims(jwt.SigningMethodRS256, jwt.MapClaims{
		"sub": uuid.Must(uuid.NewV4()).String(),
		"iss": issuer,
		"aud": audience,
		"exp": time.Now().Add(time.Hour).Unix(),
	}).SignedString(privateKey)
	if err != nil {
		t.Fatalf("sign test token: %v", err)
	}
	return token
}
