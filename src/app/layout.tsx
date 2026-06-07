import type { Metadata } from "next"
import { JetBrains_Mono, Plus_Jakarta_Sans, Source_Serif_4 } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"

const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta-sans",
  weight: ["300", "400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
})

const fontSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif-4",
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
})

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
})

export const metadata: Metadata = {
  title: { template: "%s | StudyLab", default: "StudyLab" },
  description: "Dein persönlicher Lernbereich für die Klausurvorbereitung.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="de"
      className={`${fontSans.variable} ${fontSerif.variable} ${fontMono.variable}`}
    >
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
