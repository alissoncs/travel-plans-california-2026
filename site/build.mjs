// Gera site/dist/ para hospedagem estática (Vercel com Root Directory = site).
// index.html é um fragmento no formato de Artifact; aqui ele ganha o esqueleto
// <!doctype html> com charset e viewport. JSON e imagens são copiados.
// Uso (dentro de site/): node build.mjs
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const site = dirname(fileURLToPath(import.meta.url));
const dist = join(site, "dist");
const COPIAR = ["img", ...readdirSync(site).filter((f) => f.endsWith(".json") && f !== "vercel.json")];

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist);
for (const item of COPIAR) cpSync(join(site, item), join(dist, item), { recursive: true });

const fragmento = readFileSync(join(site, "index.html"), "utf8");
writeFileSync(join(dist, "index.html"), `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
</head>
<body>
${fragmento}
</body>
</html>
`);
console.log(`dist/ gerado: index.html + ${COPIAR.join(", ")}`);
