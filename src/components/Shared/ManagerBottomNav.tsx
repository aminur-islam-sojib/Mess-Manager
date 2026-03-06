"use client";

import AppBottomNav from "./AppBottomNav";
import { MessResponseType } from "@/types/MessTypes";

export default function ManagerBottomNav({
  isMessExist,
}: {
  isMessExist?: MessResponseType;
}) {
  return <AppBottomNav role="manager" isMessExist={isMessExist} />;
}
