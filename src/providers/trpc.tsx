// Stub - real tRPC removed for static deployment
import { createContext, useContext } from "react";

const StubContext = createContext<any>(null);

export const trpc = {
  service: {
    list: { useQuery: () => ({ data: null, isLoading: false }) },
    getById: { useQuery: () => ({ data: null, isLoading: false }) },
    getCategories: { useQuery: () => ({ data: null, isLoading: false }) },
  },
  booking: {
    list: { useQuery: () => ({ data: null, isLoading: false }) },
    create: { useMutation: () => ({ mutate: () => {}, isPending: false }) },
    updateStatus: { useMutation: () => ({ mutate: () => {} }) },
    delete: { useMutation: () => ({ mutate: () => {} }) },
  },
  auth: {
    me: { useQuery: () => ({ data: null, isLoading: false }) },
    logout: { useMutation: () => ({ mutate: () => {} }) },
  },
  useUtils: () => ({
    invalidate: () => Promise.resolve(),
    service: { list: { invalidate: () => {} } },
    booking: { list: { invalidate: () => {} } },
  }),
} as any;

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
