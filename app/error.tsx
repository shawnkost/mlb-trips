"use client";

import { unstable_isUnrecognizedActionError } from "next/navigation";
import { useEffect } from "react";

import { STALE_ACTION_ERROR, UNEXPECTED_ERROR } from "@/lib/actions/messages";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const stale = unstable_isUnrecognizedActionError(error);

  useEffect(() => {
    if (!stale) console.error(error);
  }, [error, stale]);

  return (
    <div role="alert" className="flex flex-col items-start gap-3">
      <p>{stale ? STALE_ACTION_ERROR : UNEXPECTED_ERROR}</p>
      <button
        type="button"
        onClick={() => (stale ? window.location.reload() : retry())}
        className="rounded-md border border-black/10 px-3 py-1.5 text-sm font-medium dark:border-white/15"
      >
        {stale ? "Refresh" : "Try again"}
      </button>
    </div>
  );
}
