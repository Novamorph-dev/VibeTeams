import "./globals.css";

export const metadata = {
  title: "VibeTeams — Vibe Coding Team Builder",
  description: "Find your perfect vibe coding partner. Build something amazing.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-white text-slate-900 font-sans antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
