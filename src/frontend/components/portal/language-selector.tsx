"use client";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "zh", label: "Chinese" },
  { code: "ar", label: "Arabic" },
  { code: "pt", label: "Português" },
];

interface LanguageSelectorProps {
  value: string;
  onChange: (lang: string) => void;
}

export default function LanguageSelector({
  value,
  onChange,
}: LanguageSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="portal-language"
        className="text-sm text-text-secondary font-medium"
      >
        Language
      </label>
      <select
        id="portal-language"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-border bg-surface-1 px-3 py-1.5 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent dark:bg-surface-2 dark:text-text-primary"
        aria-label="Select language for portal content"
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
}
