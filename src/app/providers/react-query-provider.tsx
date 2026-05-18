"use client";

import { getQueryClient } from "@/utils/get-query-client";
import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

// 참고: https://tanstack.com/query/v5/docs/framework/react/guides/advanced-ssr
export default function ReactQueryProvider(props: Props) {
  const { children } = props;
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
