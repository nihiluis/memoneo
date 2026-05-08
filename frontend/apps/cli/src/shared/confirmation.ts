import { input } from "@inquirer/prompts"
import { Command } from "@oclif/core"

interface Config {
  exit: boolean
}

export async function promptConfirmation(
  command: Command,
  textMessage: string = "",
  config?: Config
): Promise<boolean> {
  const { exit } = config ?? { exit: false }

  const baseTextMessage = textMessage ?? "Are you sure?"
  const confirmAnswer =
    (await input({ message: baseTextMessage + " y/n" })) || "n"

  const confirmAnswerStr = confirmAnswer.toLowerCase()
  if (confirmAnswerStr !== "y" && exit) {
    command.exit()
  }

  return confirmAnswerStr === "y"
}
