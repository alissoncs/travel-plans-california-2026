// Gera dist/ para hospedagem estática (Vercel, Netlify, GitHub Pages).
// site/index.html é um fragmento no formato de Artifact; aqui ele ganha o
// esqueleto <!doctype html> com charset e viewport. JSON e imagens são copiados.
// Uso: node scripts/build.mjs
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const site = join(raiz, "site");
const dist = join(raiz, "dist");

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
cpSync(site, dist, { recursive: true, filter: (src) => !src.endsWith("index.html") });

const fragmento = readFileSync(join(site, "index.html"), "utf8");
const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
</head>
<body>
${fragmento}
</body>
</html>
`;
writeFileSync(join(dist, "index.html"), html);
console.log("dist/ gerado");
