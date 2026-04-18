import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";

import "./globals.css";
import Navbar from "@/components/Navbar";

const bricolageGrotesque = Bricolage_Grotesque({
    variable: "--font-bricolage-grotesque",
    subsets: ['latin'],
    weight: ['300', '400', '500', '600', '700', '800'],
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

export default function RootLayout({ children }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${bricolageGrotesque.variable} ${inter.variable} relative font-sans antialiased` }>
                <ClerkProvider>
                    <Navbar />
                    <main>
                        {children}
                    </main>
                    <Toaster />
                </ClerkProvider>
            </body>
        </html>
    );
}