"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function OAuthCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const success = searchParams.get("success") === "true";
  const error = searchParams.get("error");

  useEffect(() => {
    if (success) {
      // Signal to any opener window (popup flow)
      localStorage.setItem("google-oauth-connected", "true");

      if (window.opener) {
        // Popup flow: close immediately — parent polls for popup.closed
        window.close();
      } else {
        // Full-page flow: redirect to onboarding step 3
        const timer = setTimeout(() => {
          router.replace("/onboarding?step=3");
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [success, router]);

  if (error) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-heading font-bold text-text-primary">
              Connection Failed
            </h1>
            <p className="text-sm text-text-secondary">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/onboarding")}
            className="w-full py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-muted transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Success — brief loading state before redirect
  return (
    <div className="min-h-screen bg-surface-0 flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
          <svg
            className="w-8 h-8 text-green-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-heading font-bold text-text-primary">
            Connected
          </h1>
          <p className="text-sm text-text-secondary">Redirecting...</p>
        </div>
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface-0 flex items-center justify-center">
        <div className="text-text-secondary text-sm">Loading...</div>
      </div>
    }>
      <OAuthCallbackContent />
    </Suspense>
  );
}
