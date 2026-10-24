import type { ReactNode } from "react";
import "./globals.css";

export const metadata = { title: "Elos" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Theme before paint, from the viewer's last choice; dark otherwise. The faces come with the system's CSS (system.json fonts). */}
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('elos-theme');if(t)document.documentElement.setAttribute('data-theme',t)}catch(e){}` }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
