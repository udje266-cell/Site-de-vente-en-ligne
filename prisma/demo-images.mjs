// Génère les visuels de démonstration (public/demo/*.webp). Usage : node prisma/demo-images.mjs
import sharp from "sharp";
const items = [
  ["karite-brut", "#e7d3a1", "Karité brut"], ["karite-parfume", "#f3e2b8", "Karité parfumé"], ["karite-savon", "#d9c08a", "Savon karité"],
  ["karite-baume", "#efe0c0", "Baume karité"], ["miel-foret", "#c47a12", "Miel de forêt"], ["miel-acacia", "#e2a52b", "Miel d'acacia"],
  ["miel-rayon", "#b8650f", "Miel en rayon"], ["miel-gingembre", "#d48a1e", "Miel gingembre"], ["mais-poudre", "#f2cf4a", "Poudre de maïs"],
  ["mil-grains", "#b99a5b", "Grains de mil"], ["mil-farine", "#d8c39a", "Farine de mil"], ["mais-grains", "#e8b923", "Maïs grains"],
];
for (const [slug, color, label] of items) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800"><rect width="800" height="800" fill="${color}"/><circle cx="400" cy="360" r="190" fill="#fff" fill-opacity=".35"/><text x="400" y="640" font-family="sans-serif" font-size="56" text-anchor="middle" fill="#3b2a12">${label.replace("'", "&#39;")}</text></svg>`;
  await sharp(Buffer.from(svg)).webp({ quality: 70 }).toFile(`public/demo/${slug}.webp`);
}
