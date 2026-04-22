"use client";

import { useEffect } from "react";

/**
 * Generates and persists a guest_token in sessionStorage on first visit.
 * This UUID is attached to all guest orders for secure guest-to-registered merge.
 * Merge uses session token ONLY — never by phone number match alone.
 */
export default function GuestTokenInit() {
  useEffect(() => {
    if (!sessionStorage.getItem("guest_token")) {
      sessionStorage.setItem("guest_token", crypto.randomUUID());
    }
  }, []);

  return null;
}
