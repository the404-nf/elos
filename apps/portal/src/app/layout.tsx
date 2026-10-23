import type { ReactNode } from "react";
import "./globals.css";

export const metadata = { title: "Elos" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
        {/* Theme before paint, from the viewer's last choice. */}
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('elos-theme');if(t)document.documentElement.setAttribute('data-theme',t)}catch(e){}` }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
