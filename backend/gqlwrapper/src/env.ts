export const DEV = process.env.NODE_ENV === "development"

export const AUTH_API_URL = process.env.AUTH_API_URL ?? "http://localhost:8089"
export const MASTER_API_URL = process.env.MASTER_API_URL ?? "http://localhost:8084"

export const ENDPOINT_AUTH_URL = `${AUTH_API_URL}/auth`
export const ENDPOINT_GQL_URL = `${MASTER_API_URL}/v1/graphql`
export const ENDPOINT_RELAY_URL = `${MASTER_API_URL}/v1/relay`

export const PORT = process.env.PORT || 8073

export const VERSION = "0.0.1"
