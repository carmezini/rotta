import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Rotta — sua vida com direção",
    description: "Metas, limites e hábitos reunidos em um painel pessoal.",
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
