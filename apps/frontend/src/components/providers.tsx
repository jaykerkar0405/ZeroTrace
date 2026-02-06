"use client";

import { WagmiProvider } from "wagmi";
import { getConfig } from "@/lib/wagmi";
import "@rainbow-me/rainbowkit/styles.css";
import { useState, useEffect } from "react";
import { ThemeProvider, useTheme } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { darkTheme, lightTheme, RainbowKitProvider } from "@rainbow-me/rainbowkit";

function RainbowKitWithTheme({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();

  return (
    <RainbowKitProvider theme={resolvedTheme === "dark" ? darkTheme() : lightTheme()}>
      {children}
    </RainbowKitProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [queryClient] = useState(() => new QueryClient());
  const [config, setConfig] = useState<ReturnType<typeof getConfig> | null>(null);

  useEffect(() => {
    setMounted(true);
    setConfig(getConfig());
  }, []);

  if (!mounted || !config) {
    return null;
  }

  return (
    <ThemeProvider enableSystem attribute="class" defaultTheme="system" disableTransitionOnChange>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitWithTheme>{children}</RainbowKitWithTheme>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  );
}
