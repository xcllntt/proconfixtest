import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { DecisionProvider } from "@/lib/decision-context"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Procon - AI-Powered Decision Making",
  description:
    "Make better decisions with AI-powered pros and cons analysis. Procon helps you think through your choices clearly.",
  generator: "v0.app",
  icons: {
    icon: "/procon-logo.jpg",
  },
}

export const viewport: Viewport = {
  themeColor: "#1a1a2e",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <DecisionProvider>{children}</DecisionProvider>

        {/* Vercel analytics */}
        <Analytics />

        {/* Vercel speed insights */}
        <SpeedInsights />
      </body>
    </html>
  )
}
