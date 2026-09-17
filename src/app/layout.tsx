import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "./CartContext";

export const metadata: Metadata = {
  title: "AfricaMarket",
  description: "A marketplace built for Africa and beyond.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}