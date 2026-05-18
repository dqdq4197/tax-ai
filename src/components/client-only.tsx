import useIsServer from "@/hooks/use-is-server";
import type { PropsWithChildren } from "react";

export default function ClientOnly({ children }: PropsWithChildren) {
  const isServer = useIsServer();

  if (isServer) {
    return;
  }

  return children;
}
