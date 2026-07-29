import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Rotta — sua vida com direção",
    description: "Metas, limites e hábitos reunidos em um painel pessoal.",
    applicationName: "Rotta",
    manifest: "/manifest.webmanifest",
    appleWebApp: {
        capable: true,
        title: "Rotta",
        statusBarStyle: "black",
    },
    formatDetection: {
        telephone: false,
    },
    icons: {
        icon: [
            { url: "/icon_v2-192.png", sizes: "192x192", type: "image/png" },
            { url: "/icon_v2-512.png", sizes: "512x512", type: "image/png" },
        ],
        apple: "/icon_v2-180.png",
    },
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
    interactiveWidget: "resizes-content",
    themeColor: "#433B8D",
    colorScheme: "light",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="pt-BR"
            className="h-full antialiased"
            suppressHydrationWarning
        >
            <body className="min-h-full flex flex-col">{children}</body>
        </html>
    );
}
