import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/providers/auth-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ARPT Guinée - Plateforme de Régulation des Télécommunications",
  description:
    "Plateforme numérique de l'Autorité de Régulation des Postes et Télécommunications de Guinée. Suivi QoS, gestion des plaintes, sanctions, audits et décisions réglementaires.",
  keywords: [
    "ARPT",
    "Guinée",
    "régulation",
    "télécommunications",
    "QoS",
    "qualité de service",
    "plaintes",
    "sanctions",
    "audits",
  ],
  authors: [{ name: "ARPT Guinée" }],
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
