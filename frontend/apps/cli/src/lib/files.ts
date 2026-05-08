import * as fs from "fs/promises"
import * as path from "path"
import markdownParser from "./markdownParser.js"
import * as crypto from "crypto"

export interface MarkdownFileMetadata {
  id?: string
  title?: string
  date?: string
  version?: number
}

export interface MarkdownFileInfo {
  fileName: string
  path: string
  text: string
  modifiedTime: Date
  createdTime: Date
  metadata: MarkdownFileMetadata
  willBeCreated?: string
}

export async function getAllMarkdownFiles(
  baseDir: string,
  dir: string,
  arrayOfFiles: MarkdownFileInfo[] = []
): Promise<MarkdownFileInfo[]> {
  const files = await fs.readdir(dir)

  for (let file of files) {
    const filePath = path.join(dir, file)
    const stat = await fs.stat(filePath)
    if (stat.isDirectory()) {
      const dirFiles = await getAllMarkdownFiles(
        baseDir,
        filePath,
        arrayOfFiles
      )
      arrayOfFiles = dirFiles
    } else {
      if (file.endsWith(".md")) {
        const fileContentBuffer = await fs.readFile(filePath)
        const fileContent = fileContentBuffer.toString("utf-8")

        const mdContent = markdownParser(fileContent)

        const info: MarkdownFileInfo = {
          fileName: file.slice(0, file.length - ".md".length),
          path: filePath.slice(
            baseDir.length + 1,
            filePath.length - file.length - 1
          ),
          text: mdContent.content.trim(),
          modifiedTime: stat.mtime,
          createdTime: stat.ctime,
          metadata: mdContent.metadata,
        }
        arrayOfFiles.push(info)
      }
    }
  }

  return arrayOfFiles
}

export function md5HashText(text: string): string {
  return crypto.createHash("md5").update(text).digest("base64")
}
