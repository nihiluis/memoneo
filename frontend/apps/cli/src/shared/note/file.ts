export function isValidFilename(str: string) {
    const pattern = /^[a-zA-Z0-9\s\-_]*$/;
    return pattern.test(str);
  }
  