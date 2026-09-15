import React from 'react';
import './globals.css'; // Tailwind CSSの読み込み（Vercel側で自動処理されます）

export const metadata = {
  title: 'シフト・まかせ太',
  description: 'AI自動シフト調整＆管理アプリ',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="bg-slate-50 antialiased">
        {children}
      </body>
    </html>
  );
}
