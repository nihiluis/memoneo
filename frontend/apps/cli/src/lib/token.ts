import * as fs from "fs/promises"

export async function readToken(): Promise<string> {
  await ensureTokenPermissions()
  const tokenBuffer = await fs.readFile("./.memoneo/token")

  return tokenBuffer.toString("utf-8")
}

export async function writeToken(token: string) {
  const encodedToken = Buffer.from(token, "utf8")

  await fs.writeFile("./.memoneo/token", encodedToken, {
    encoding: "base64",
    mode: 0o600,
  })
  await fs.chmod("./.memoneo/token", 0o600)
}

async function ensureTokenPermissions() {
  try {
    const stat = await fs.stat("./.memoneo/token")
    if ((stat.mode & 0o777) !== 0o600) {
      await fs.chmod("./.memoneo/token", 0o600)
    }
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code
    if (code !== "ENOENT") {
      throw err
    }
  }
}
