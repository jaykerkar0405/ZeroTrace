import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "ZeroTrace - Decentralized Quadratic Funding Platform",
  description:
    "A decentralized platform enabling communities to fairly allocate treasury funds to public good projects through quadratic voting and funding, while maintaining complete voter anonymity and preventing sybil attacks with Anon Aadhaar integration.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`antialiased ${inter.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
