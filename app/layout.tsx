import type { Metadata } from "next";
import { IBM_Plex_Serif, Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";

import "./globals.css";
import Navbar from "@/components/Navbar";

const ibmPlexSerif = IBM_Plex_Serif({
    variable: "--font-ibm-plex-serif",
    subsets: ['latin'],
    weight: ['400', '500', '600', '700'],
    display: 'swap'
});

const inter = Inter({
    variable: '--font-inter',
    subsets: ['latin'],
    display: 'swap'
})

export const metadata: Metadata = {
    title: "StudyMax",
    description: "Transform your books into interactive AI conversations. Upload PDFs, and chat with your books using voice.",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${ibmPlexSerif.variable} ${inter.variable} relative font-sans antialiased` }>
                <ClerkProvider>
                    <Navbar/>
                    <main className="pt-[var(--navbar-height)]">
                        {children}
                    </main>
                </ClerkProvider>
            </body>
        </html>
    );
}