import type { Metadata } from "next";
import { Rakkas, Jost, Gloock } from "next/font/google";
import "./globals.css";

const rakkas = Rakkas({
  variable: "--font-rakkas",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const gloock = Gloock({
  variable: "--font-gloock",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Apartment Decision",
  description:
    "A collaborative tool for two people deciding on an apartment together.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${rakkas.variable} ${jost.variable} ${gloock.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
