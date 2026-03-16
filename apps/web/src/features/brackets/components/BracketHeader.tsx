import { useCallback, useState } from 'react';

interface BracketHeaderProps {
  bracketName: string;
  createdAt: string;
}

export function BracketHeader({ bracketName, createdAt }: BracketHeaderProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may fail without HTTPS or focus
    }
  }, []);

  const formattedDate = new Date(createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="flex items-center justify-between bg-brand px-6 py-4 text-brand-foreground">
      <div>
        <h1 className="text-xl font-bold">{bracketName}</h1>
        <p className="mt-0.5 text-sm opacity-85">Submitted {formattedDate}</p>
      </div>
      <button
        type="button"
        onClick={handleShare}
        className="rounded-md bg-white/20 px-3.5 py-1.5 text-sm transition-colors hover:bg-white/30"
      >
        {copied ? 'Copied!' : 'Share Link'}
      </button>
    </div>
  );
}
