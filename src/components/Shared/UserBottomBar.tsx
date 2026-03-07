"use client";

import AppBottomNav from "./AppBottomNav";
import { MessResponseType } from "@/types/MessTypes";

export default function UserBottomNav({
  isMessExist,
}: {
  isMessExist?: MessResponseType;
}) {
  return <AppBottomNav role="user" isMessExist={isMessExist} />;
}
