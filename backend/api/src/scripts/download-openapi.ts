const port = process.env.PORT ?? "8073"
const url = process.env.OPENAPI_URL ?? `http://localhost:${port}/openapi/json`
const outputPath = process.env.OPENAPI_OUT ?? "openapi.json"

const response = await fetch(url)

if (!response.ok) {
  throw new Error(
    `Failed to download OpenAPI spec from ${url}: ${response.status} ${response.statusText}`
  )
}

const spec = await response.text()
await Bun.write(outputPath, spec.endsWith("\n") ? spec : `${spec}\n`)

console.log(`Downloaded OpenAPI spec from ${url} to ${outputPath}`)
