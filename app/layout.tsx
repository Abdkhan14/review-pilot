import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";
import "./globals.css";
import { layoutClass } from "./tokens";

const font = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Review Pilot",
  description: "Scan a barcode to generate reviews for your business.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className={`${layoutClass.body} ${font.className}`}>
        <div className={layoutClass.column}>{children}</div>
      </body>
    </html>
  );
}
