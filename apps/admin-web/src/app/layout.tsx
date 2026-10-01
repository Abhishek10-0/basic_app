import type { Metadata } from "next";
import { Providers } from "../components/Providers";
import "./globals.css";
export const metadata: Metadata = {
  title: "SME Chamber | Administration",
  description: "SME Chamber of India administration portal",
  icons: { icon: "/logo.png" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
