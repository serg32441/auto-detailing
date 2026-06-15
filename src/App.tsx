import { useState, type ReactNode } from "react";
import { Routes, Route, useLocation } from "react-router";
import { Toaster } from "@/components/ui/sonner";
import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import superjson from "superjson";
import type { AppRouter } from "../api/router";
import "./App.css";
import Home from "./pages/Home";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Services from "./pages/Services";
import ServiceDetail from "./pages/ServiceDetail";
import Admin from "./pages/Admin";
import BtiCompare from "./pages/BtiCompare";
import Navbar from "./components/Navbar";

// === tRPC inline ===
const _trpc = createTRPCReact<AppRouter>();

const _queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false },
    mutations: { retry: false },
  },
});

const _trpcClient = _trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
    }),
  ],
});

export const trpc = _trpc;
export const queryClient = _queryClient;

function TRPCProvider({ children }: { children: ReactNode }) {
  const [_r] = useState(0);
  void _r;
  return (
    <_trpc.Provider client={_trpcClient} queryClient={_queryClient}>
      <QueryClientProvider client={_queryClient}>
        {children}
      </QueryClientProvider>
    </_trpc.Provider>
  );
}
// === end tRPC ===

function AppShell() {
  // The /bti module is meant to be embedded inside amoCRM, so hide the
  // marketing navbar there.
  const isEmbedded = useLocation().pathname.startsWith("/bti");
  return (
    <>
      {!isEmbedded && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/services" element={<Services />} />
        <Route path="/services/:id" element={<ServiceDetail />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/bti" element={<BtiCompare />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster position="top-right" />
    </>
  );
}

export default function App() {
  return (
    <TRPCProvider>
      <AppShell />
    </TRPCProvider>
  );
}
