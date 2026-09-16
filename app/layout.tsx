import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Review Pilot",
  description: "Scan a barcode to generate reviews for your business.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
