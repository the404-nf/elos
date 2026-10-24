"use client";
import { useState } from "react";
import { Button, Icon } from "./elos-client.tsx";

/** Copies text to the clipboard and says so for a moment. */
export function CopyButton({ label, text, variant = "ghost", size = "sm", icon }: { label: string; text: string; variant?: "ghost" | "glass" | "secondary"; size?: "sm" | "md"; icon?: boolean }) {
  const [done, setDone] = useState(false);
  return (
    <Button label={done ? "Copied" : label} variant={variant} size={size} icon={icon ? <Icon name={done ? "check" : "copy"} size="sm" /> : undefined}
      onClick={() => navigator.clipboard.writeText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 1500); })} />
  );
}
