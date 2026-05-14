"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  className,
  children,
  pendingChildren,
}: {
  className?: string;
  children: React.ReactNode;
  pendingChildren?: React.ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`${className ?? ""} disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {pending ? (pendingChildren ?? children) : children}
    </button>
  );
}
