import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { DATABASE_URL } from "../env.js"
import * as schema from "./schema.js"

export const sql = postgres(DATABASE_URL, { max: 10 })
export const db = drizzle(sql, { schema })
