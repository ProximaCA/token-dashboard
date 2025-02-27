import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { Web3Provider } from "./contexts/Web3Context";

export const metadata: Metadata = {
  title: "Token Analytics Dashboard",
  description: "Analyze ERC-20 token economics, track large transfers, and verify token compliance",
  icons: {
    icon: '/favicon.png',
  },
};

// Loading fallback for Web3Provider
function Web3ProviderFallback() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-12 flex items-center justify-center">
        <div className="animate-pulse">Loading application...</div>
      </div>
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.png" />
        {/* Add retry logic for chunk loading errors */}
        <script dangerouslySetInnerHTML={{
          __html: `
            // Handle chunk loading errors
            window.addEventListener('error', function(e) {
              const target = e.target;
              if (target && (target.src || target.href) && 
                  (target.tagName === 'SCRIPT' || target.tagName === 'LINK') &&
                  target.src.includes('_next/static/chunks')) {
                console.warn('Attempting to reload chunk:', target.src || target.href);
                window.location.reload();
              }
            }, true);
          `}} 
        />
      </head>
      <body>
        <Suspense fallback={<Web3ProviderFallback />}>
          <Web3Provider>
            <main className="min-h-screen">
              {children}
            </main>
          </Web3Provider>
        </Suspense>
      </body>
    </html>
  );
} 