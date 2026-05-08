package postgres

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"encoding/base64"
	"encoding/pem"
	"strings"
	"testing"
	"time"

	"github.com/gofrs/uuid/v5"
	"github.com/golang-jwt/jwt/v5"
	"github.com/nihiluis/memoneo2/auth/internal/services/auth"
)

func TestParsePrivateKeyAcceptsBase64PKCS1PEM(t *testing.T) {
	privateKey := generateTestPrivateKey(t)
	pemBytes := pem.EncodeToMemory(&pem.Block{
		Type:  "RSA PRIVATE KEY",
		Bytes: x509.MarshalPKCS1PrivateKey(privateKey),
	})
	encoded := base64.StdEncoding.EncodeToString(pemBytes)

	parsed, err := parsePrivateKey(encoded, false)
	if err != nil {
		t.Fatalf("expected base64 PKCS#1 key to parse: %v", err)
	}
	if parsed.PublicKey.N.Cmp(privateKey.PublicKey.N) != 0 {
		t.Fatal("parsed key does not match input key")
	}
}

func TestParsePrivateKeyAcceptsBase64PKCS8PEM(t *testing.T) {
	privateKey := generateTestPrivateKey(t)
	pkcs8Bytes, err := x509.MarshalPKCS8PrivateKey(privateKey)
	if err != nil {
		t.Fatalf("marshal PKCS#8 key: %v", err)
	}
	pemBytes := pem.EncodeToMemory(&pem.Block{
		Type:  "PRIVATE KEY",
		Bytes: pkcs8Bytes,
	})
	encoded := base64.StdEncoding.EncodeToString(pemBytes)

	parsed, err := parsePrivateKey(encoded, false)
	if err != nil {
		t.Fatalf("expected base64 PKCS#8 key to parse: %v", err)
	}
	if parsed.PublicKey.N.Cmp(privateKey.PublicKey.N) != 0 {
		t.Fatal("parsed key does not match input key")
	}
}

func TestParsePrivateKeyRequiresConfiguredKeyUnlessGenerationAllowed(t *testing.T) {
	if _, err := parsePrivateKey("", false); err == nil {
		t.Fatal("expected missing signing key to fail")
	}

	privateKey, err := parsePrivateKey("", true)
	if err != nil {
		t.Fatalf("expected generated key when explicitly allowed: %v", err)
	}
	if privateKey.N.BitLen() < 2048 {
		t.Fatalf("expected generated RSA key to be at least 2048 bits, got %d", privateKey.N.BitLen())
	}
}

func TestCheckTokenRequiresIssuerAndAudience(t *testing.T) {
	privateKey := generateTestPrivateKey(t)
	service := &Postgres{
		config: &auth.Config{
			Issuer:   "memoneo-auth-test",
			Audience: "memoneo-test",
		},
		privateKey: privateKey,
		publicKey:  &privateKey.PublicKey,
	}

	validToken := signTestToken(t, privateKey, "memoneo-auth-test", "memoneo-test")
	if err := service.CheckToken(validToken); err != nil {
		t.Fatalf("expected valid token to pass: %v", err)
	}

	wrongAudienceToken := signTestToken(t, privateKey, "memoneo-auth-test", "other-audience")
	if err := service.CheckToken(wrongAudienceToken); err == nil {
		t.Fatal("expected token with wrong audience to fail")
	}

	missingIssuerToken := signTokenWithClaims(t, privateKey, jwt.MapClaims{
		"sub": uuid.Must(uuid.NewV4()).String(),
		"aud": "memoneo-test",
		"exp": time.Now().Add(time.Hour).Unix(),
	})
	if err := service.CheckToken(missingIssuerToken); err == nil || !strings.Contains(err.Error(), "iss") {
		t.Fatalf("expected missing issuer to fail, got %v", err)
	}
}

func generateTestPrivateKey(t *testing.T) *rsa.PrivateKey {
	t.Helper()

	privateKey, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatalf("generate RSA key: %v", err)
	}
	return privateKey
}

func signTestToken(t *testing.T, privateKey *rsa.PrivateKey, issuer string, audience string) string {
	t.Helper()

	return signTokenWithClaims(t, privateKey, jwt.MapClaims{
		"sub": uuid.Must(uuid.NewV4()).String(),
		"iss": issuer,
		"aud": audience,
		"exp": time.Now().Add(time.Hour).Unix(),
	})
}

func signTokenWithClaims(t *testing.T, privateKey *rsa.PrivateKey, claims jwt.MapClaims) string {
	t.Helper()

	token, err := jwt.NewWithClaims(jwt.SigningMethodRS256, claims).SignedString(privateKey)
	if err != nil {
		t.Fatalf("sign test token: %v", err)
	}
	return token
}
