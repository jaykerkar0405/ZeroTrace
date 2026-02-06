"use client";

import {
  darkTheme,
  lightTheme,
  getDefaultConfig,
  RainbowKitProvider,
} from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import "@rainbow-me/rainbowkit/styles.css";
import { ThemeProvider, useTheme } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { mainnet, sepolia, polygon, optimism, arbitrum, base } from "wagmi/chains";

const config = getDefaultConfig({
  ssr: true,
  appName: "ZeroTrace",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
  chains: [mainnet, sepolia, polygon, optimism, arbitrum, base],
});

const queryClient = new QueryClient();

function RainbowKitWithTheme({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();

  return (
    <RainbowKitProvider theme={resolvedTheme === "dark" ? darkTheme() : lightTheme()}>
      {children}
    </RainbowKitProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
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
