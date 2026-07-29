import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "Rotta — sua vida com direção",
        short_name: "Rotta",
        description: "Metas, limites e hábitos reunidos em um painel pessoal.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait-primary",
        background_color: "#F4D35E",
        theme_color: "#433B8D",
        lang: "pt-BR",
        icons: [
            {
                src: "/icon.svg",
                sizes: "any",
                type: "image/svg+xml",
                purpose: "maskable",
            },
        ],
    };
}
