"use client";

import { useState } from "react";
import { ShareIcon } from "./icons";

export function ShareButtons({
  url,
  title,
  text,
  withIcon = false,
}: {
  url: string;
  title: string;
  text: string;
  withIcon?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        className={withIcon ? "btn-ghost" : "btn-secondary"}
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
        {withIcon && <ShareIcon className="h-5 w-5" />}
        {copied ? "Link copiado!" : "Compartilhar"}
      </button>
    </div>
  );
}
