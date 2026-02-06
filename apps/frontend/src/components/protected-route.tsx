"use client";

import { useEffect } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isConnected } = useAccount();

  useEffect(() => {
    if (!isConnected) {
      router.push("/connect");
    }
  }, [isConnected, router]);

  if (!isConnected) {
    return null;
  }

  return <>{children}</>;
}
