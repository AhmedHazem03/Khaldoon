"use client";

import { useEffect } from "react";
import { ensureGuestToken } from "@/lib/guest-token";

/**
 * Generates and persists a guest_token in localStorage on first visit.
 * Storing in localStorage (vs sessionStorage) lets guests see their order
 * history even after closing the tab and prevents data loss during the
 * OAuth redirect.
 */
export default function GuestTokenInit() {
  useEffect(() => {
    ensureGuestToken();
  }, []);

  return null;
}
