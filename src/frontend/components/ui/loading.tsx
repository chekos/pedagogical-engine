// LoadingSpinner — centered spinner with optional message
export function LoadingSpinner({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-text-tertiary" role="status" aria-label={message}>
      <div className="w-8 h-8 border-2 border-border border-t-accent rounded-full animate-spin mb-4" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}

// ErrorBanner — red-tinted error display with optional retry
export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 text-red-300" role="alert">
      <p>{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-2 text-sm underline hover:text-red-200">
          Try again
        </button>
      )}
    </div>
  );
}

// EmptyState — friendly empty state with optional action
export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="text-center py-20 text-text-tertiary">
      <p className="text-lg font-medium">{title}</p>
      {description && <p className="mt-2 text-sm">{description}</p>}
    </div>
  );
}
