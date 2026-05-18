import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

function useIsServer() {
  return useSyncExternalStore(
    emptySubscribe,
    () => false,
    () => true,
  );
}

export default useIsServer;
