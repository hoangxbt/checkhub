import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { TOOLS } from './src/utils/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, 'dist');

if (!fs.existsSync(distDir)) {
  console.error("❌ No dist folder found. Run 'vite build' first.");
  process.exit(1);
}

const baseHtmlPath = path.join(distDir, 'index.html');
const baseHtml = fs.readFileSync(baseHtmlPath, 'utf8');

console.log('🚀 Starting Pre-rendering for SEO...');

let successCount = 0;

for (const tool of TOOLS) {
  const pageTitle = tool.path === '/' 
    ? 'CheckHub — Free DNS Checker & Network Tools' 
    : `${tool.name} — CheckHub`;
  const pageUrl = `https://checkhub.org${tool.path === '/' ? '' : tool.path}`;
  const pageDesc = tool.path === '/' 
    ? 'Free DNS Propagation Checker, WHOIS, SSL Checker, and 29+ network diagnostic tools. Fast, modern, no ads, no tracking.' 
    : `${tool.description}. Free online tool by CheckHub.`;

  let newHtml = baseHtml;

  // Replace Title
  newHtml = newHtml.replace(/<title>.*?<\/title>/i, `<title>${pageTitle}</title>`);
  
  // Replace Meta (support varying formats/minification)
  newHtml = newHtml.replace(/(<meta\s+name="description"\s+content=")([^"]*)(">)/i, `$1${pageDesc}$3`);
  newHtml = newHtml.replace(/(<meta\s+property="og:title"\s+content=")([^"]*)(">)/i, `$1${pageTitle}$3`);
  newHtml = newHtml.replace(/(<meta\s+property="og:description"\s+content=")([^"]*)(">)/i, `$1${pageDesc}$3`);
  newHtml = newHtml.replace(/(<meta\s+property="og:url"\s+content=")([^"]*)(">)/i, `$1${pageUrl}$3`);
  newHtml = newHtml.replace(/(<meta\s+name="twitter:title"\s+content=")([^"]*)(">)/i, `$1${pageTitle}$3`);
  newHtml = newHtml.replace(/(<meta\s+name="twitter:description"\s+content=")([^"]*)(">)/i, `$1${pageDesc}$3`);
  newHtml = newHtml.replace(/(<link\s+rel="canonical"\s+href=")([^"]*)(">)/i, `$1${pageUrl}$3`);

  // Inject Structured Data (JSON-LD)
  const structuredData = tool.path === '/' ? {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    'name': 'CheckHub',
    'url': 'https://checkhub.org',
    'description': pageDesc,
    'applicationCategory': 'UtilityApplication',
    'operatingSystem': 'All',
    'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' },
    'author': { '@type': 'Organization', 'name': 'CheckHub' }
  } : {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    'name': tool.name,
    'url': pageUrl,
    'description': tool.description,
    'applicationCategory': 'UtilityApplication',
    'operatingSystem': 'All',
    'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' },
    'isPartOf': { '@type': 'WebSite', 'name': 'CheckHub', 'url': 'https://checkhub.org' }
  };

  const ldJson = `\n<script type="application/ld+json">\n${JSON.stringify(structuredData)}\n</script>\n</head>`;
  newHtml = newHtml.replace('</head>', ldJson);

  // Write static HTML
  if (tool.path === '/') {
    fs.writeFileSync(baseHtmlPath, newHtml);
  } else {
    const dir = path.join(distDir, tool.path.slice(1));
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), newHtml);
  }
  
  successCount++;
}

console.log(`✅ Pre-rendering complete! Generated ${successCount} static HTML files.`);
