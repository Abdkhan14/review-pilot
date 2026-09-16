import type { Metadata } from "next";
import "./globals.css";
import { layoutClass } from "./tokens";

export const metadata: Metadata = {
  title: "Review Pilot",
  description: "Scan a barcode to generate reviews for your business.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className={layoutClass.body}>
        <div className={layoutClass.column}>{children}</div>
      </body>
    </html>
  );
}
