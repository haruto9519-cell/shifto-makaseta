import React from 'react';
import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className="bg-slate-50 antialiased min-h-screen font-sans">
      {/* 簡易的なTailwind CDNの読み込みを保証 */}
      <link href="https://jsdelivr.net" rel="stylesheet" />
      <Component {...pageProps} />
    </div>
  );
}
