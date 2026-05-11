export { trpc, queryClient } from "./App";

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
