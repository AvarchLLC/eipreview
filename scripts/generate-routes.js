import fs from "node:fs";
import path from "node:path";

const distDir = path.resolve("dist");
const indexPath = path.join(distDir, "index.html");

if (!fs.existsSync(indexPath)) {
  console.error("dist/index.html does not exist. Run vite build first.");
  process.exit(1);
}

const baseHtml = fs.readFileSync(indexPath, "utf-8");

const routes = [
  {
    path: "new",
    title: "Draft New Proposal — EIP Review",
    desc: "Draft, author, and validate Ethereum Improvement Proposals with real-time CI checks, RFC 2119 linting, and instant preview.",
    canonical: "https://eipreview.com/new",
  },
  {
    path: "review",
    title: "Review PR — EIP Review",
    desc: "Review open EIP, ERC, and RIP pull requests directly from GitHub with instant editorial and CI linting.",
    canonical: "https://eipreview.com/review",
  },
  {
    path: "import",
    title: "Import Proposal — EIP Review",
    desc: "Import and edit existing EIPs, ERCs, and RIPs directly by proposal number.",
    canonical: "https://eipreview.com/import",
  },
  {
    path: "about",
    title: "About — EIP Review",
    desc: "The browser-native workspace for authoring, reviewing, and editing Ethereum Improvement Proposals.",
    canonical: "https://eipreview.com/about",
  },
];

for (const r of routes) {
  const targetDir = path.join(distDir, r.path);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  let routeHtml = baseHtml;
  routeHtml = routeHtml.replace(/<title>.*?<\/title>/, `<title>${r.title}</title>`);
  routeHtml = routeHtml.replace(/<meta name="title" content=".*?" \/>/, `<meta name="title" content="${r.title}" />`);
  routeHtml = routeHtml.replace(/<meta property="og:title" content=".*?" \/>/, `<meta property="og:title" content="${r.title}" />`);
  routeHtml = routeHtml.replace(/<meta name="twitter:title" content=".*?" \/>/, `<meta name="twitter:title" content="${r.title}" />`);

  routeHtml = routeHtml.replace(/<meta\s+name="description"\s+content=".*?"\s*\/>/s, `<meta name="description" content="${r.desc}" />`);
  routeHtml = routeHtml.replace(/<meta\s+property="og:description"\s+content=".*?"\s*\/>/s, `<meta property="og:description" content="${r.desc}" />`);
  routeHtml = routeHtml.replace(/<meta\s+name="twitter:description"\s+content=".*?"\s*\/>/s, `<meta name="twitter:description" content="${r.desc}" />`);

  routeHtml = routeHtml.replace(/<meta property="og:url" content=".*?" \/>/, `<meta property="og:url" content="${r.canonical}" />`);
  routeHtml = routeHtml.replace(/<meta name="twitter:url" content=".*?" \/>/, `<meta name="twitter:url" content="${r.canonical}" />`);
  routeHtml = routeHtml.replace(/<link rel="canonical" href=".*?" \/>/, `<link rel="canonical" href="${r.canonical}" />`);

  // Ensure all asset paths are root-relative (avoid ./assets on nested paths)
  routeHtml = routeHtml.replace(/(src|href)="\.\/(assets|favicon|icon|site)/g, '$1="/$2');

  const targetPath = path.join(targetDir, "index.html");
  fs.writeFileSync(targetPath, routeHtml, "utf-8");
  console.log(`Generated ${r.path}/index.html`);
}

// Ensure 404.html also exists for any dynamic routes (e.g. /review/12660, /eip/1559)
fs.copyFileSync(indexPath, path.join(distDir, "404.html"));
console.log("Copied index.html to 404.html");
