import * as colors from "ansi-colors"

export function logIntro(command: string, version: string) {
  console.log(colors.bold(`memoneo ${command} ${version}`))
}
