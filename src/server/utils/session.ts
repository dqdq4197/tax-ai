import "server-only";

import { cookies } from "next/headers";
import { ANON_ID_COOKIE } from "@/constants";

export async function getAnonId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ANON_ID_COOKIE)?.value ?? null;
}
