"use client";

import { useState } from "react";

export function ShareButtons({ url, title, text }: { url: string; title: string; text: string }) {
  const [copied, setCopied] = useState(false);
  const message = `${text} ${url}`;

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        className="btn-secondary"
        onClick={async () => {
          if (navigator.share) {
            try {
              await navigator.share({ title, text, url });
              return;
            } catch {
            }
          }
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? "Link copiado!" : "Compartilhar"}
      </button>
      <a
        className="btn-secondary"
        href={`https://wa.me/?text=${encodeURIComponent(message)}`}
        target="_blank"
        rel="noopener"
      >
        WhatsApp
      </a>
      <a
        className="btn-secondary"
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener"
      >
        Facebook
      </a>
    </div>
  );
}
