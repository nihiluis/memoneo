import { AuthResult, apiLogin } from "../lib/auth.js"
import * as fs from "fs/promises"
import { ux as cliUx } from "@oclif/core"
import { input, password as passwordInput } from "@inquirer/prompts"
import { writeToken } from "../lib/token.js"

export type LoginResult = AuthResult & { password: string; mail: string }

export async function performLogin(
  mail: string = "",
  password: string = ""
): Promise<LoginResult> {
  mail = mail || (await input({ message: "What is your mail?" }))
  password =
    password || (await passwordInput({ message: "What is your password?" }))

  cliUx.action.start("Authenticating mail=" + mail)
  const authResult = await apiLogin(mail, password)
  const { errorMessage, error, enckey, token, success } = authResult
  if (error || !success) {
    throw new Error(
      `Unable to auth using given mail and password due to: ${
        errorMessage || "no error given"
      }.`
    )
  }
  if (!enckey) {
    throw new Error("Your encryption key must be set up before using the CLI.")
  }

  cliUx.action.stop()

  await writeToken(token)

  return { ...authResult, password, mail }
}
