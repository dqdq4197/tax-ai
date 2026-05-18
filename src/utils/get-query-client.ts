import {
  QueryClient,
  type QueryClientConfig,
  defaultShouldDehydrateQuery,
  environmentManager,
} from "@tanstack/react-query";

function minutesToMilliseconds(minutes: number) {
  return minutes * 60 * 1000;
}

export function makeQueryClient(
  defaultOptions?: QueryClientConfig["defaultOptions"],
) {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime:
          defaultOptions?.queries?.staleTime ?? minutesToMilliseconds(1),
        gcTime: defaultOptions?.queries?.gcTime ?? minutesToMilliseconds(5),
      },
      dehydrate: {
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

// 참고: https://tanstack.com/query/v5/docs/framework/react/guides/advanced-ssr#streaming-with-server-components
export function getQueryClient(
  defaultOptions?: QueryClientConfig["defaultOptions"],
) {
  if (environmentManager.isServer()) {
    // Server: always make a new query client
    return makeQueryClient(defaultOptions);
  }

  // Browser: make a new query client if we don't already have one
  // This is very important, so we don't re-make a new client if React
  // suspends during the initial render. This may not be needed if we
  // have a suspense boundary BELOW the creation of the query client
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient(defaultOptions);
  }

  return browserQueryClient;
}
