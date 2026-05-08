export function toError(message: string, cause?: unknown): Error {
  if (cause === undefined || cause === null || cause === "") {
    return new Error(message)
  }

  if (cause instanceof Error) {
    const details = getErrorMessages(cause)
    return new Error(`${message}: ${details}`, { cause })
  }

  if (typeof cause === "string") {
    return new Error(`${message}: ${cause}`)
  }

  try {
    return new Error(`${message}: ${JSON.stringify(cause)}`)
  } catch {
    return new Error(`${message}: ${String(cause)}`)
  }
}

function getErrorMessages(error: Error): string {
  const messages: string[] = []
  let current: unknown = error

  while (current instanceof Error) {
    const currentMessage = current.message
    const alreadyIncluded = messages.some(
      message =>
        message === currentMessage || message.includes(currentMessage)
    )
    if (currentMessage && !alreadyIncluded) {
      messages.push(currentMessage)
    }

    current = current.cause
  }

  return messages.join(": ")
}
