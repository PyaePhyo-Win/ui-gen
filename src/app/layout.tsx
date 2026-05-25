import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UIGen - AI Component Generator",
  description: "Generate React components with AI and live preview",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="antialiased font-sans"
      >
        {children}
      </body>
    </html>
  );
}
