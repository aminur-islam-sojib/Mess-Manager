"use client";
import { ReactNode } from "react";
import { TooltipProvider } from "../ui/tooltip";

function TooltipProviders({ children }: { children: ReactNode }) {
  return <TooltipProvider>{children}</TooltipProvider>;
}

export default TooltipProviders;
