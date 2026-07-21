"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useState } from "react";
import { Toaster } from "sonner";
import { ThemeProvider, ThemeScript } from "@/components/providers/theme-provider";
import { LocaleProvider } from "@/components/providers/locale-provider";

const ReactQueryDevtools =
  process.env.NODE_ENV === "development"
    ? dynamic(
        () =>
          import("@tanstack/react-query-devtools").then((mod) => ({
            default: mod.ReactQueryDevtools,
          })),
        { ssr: false }
      )
    : () => null;

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 2 * 60 * 1000,
            gcTime: 10 * 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <>
      <ThemeScript />
      <QueryClientProvider client={queryClient}>
        <LocaleProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </LocaleProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            classNames: {
              toast:
                "bg-surface border border-outline-variant text-on-surface shadow-violet-md rounded-xl",
              title: "text-on-surface font-semibold",
              description: "text-on-surface-variant",
              success: "border-success/30 bg-success-container",
              error: "border-error/30 bg-error-container",
            },
          }}
        />
        {process.env.NODE_ENV === "development" ? (
          <ReactQueryDevtools initialIsOpen={false} />
        ) : null}
      </QueryClientProvider>
    </>
  );
}
