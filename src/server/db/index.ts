import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as conversationsSchema from "./conversations/schema";
import * as messagesSchema from "./messages/schema";
import * as lawChunksSchema from "./law-chunks/schema";

const schema = { ...conversationsSchema, ...messagesSchema, ...lawChunksSchema };

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
