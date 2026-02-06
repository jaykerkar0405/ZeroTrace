"use client";

import { ArrowUp } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);

    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Button
      size="icon"
      onClick={scrollToTop}
      className="fixed bottom-8 right-8 z-50 rounded-full shadow-lg"
    >
      <ArrowUp className="size-5" />
      <span className="sr-only">Scroll to top</span>
    </Button>
  );
}
