# 🌐 CheckHub

**Free DNS Checker & Network Intelligence Tools — No Ads, No Tracking**

CheckHub is a modern, blazing-fast web platform offering **24 free network tools** for DNS propagation checking, domain intelligence, networking, and developer utilities. Built with performance-first architecture using Vite + Vanilla JavaScript.

> 🔗 **Live:** [checkhub.org](https://checkhub.org)

---

## ✨ Features

### 🔍 DNS Tools (9)
| Tool | Description |
|------|-------------|
| **DNS Propagation Checker** | Check DNS records across 20+ global servers with real-time status |
| **DNS Lookup** | Query A, AAAA, CNAME, MX, NS, TXT, SOA, PTR, SRV, CAA records |
| **Reverse DNS** | Find hostnames from IP addresses via PTR records |
| **DNS Compare** ⭐ | Side-by-side DNS record comparison between two domains |
| **DNSSEC Checker** | Verify DNSSEC configuration (AD flag, DNSKEY, DS records) |
| **NS Lookup** | Find nameservers with resolved IP addresses |
| **MX Lookup** | Mail server records with priority and IP resolution |
| **TXT Lookup** | TXT records with SPF/DKIM/DMARC auto-classification |
| **Public DNS List** | Curated list of 15+ providers with DoH/DoT/DNSSEC/Privacy info |

### 🏢 Domain Intelligence (5)
| Tool | Description |
|------|-------------|
| **WHOIS Lookup** | Full registration info via RDAP — registrar, dates, contacts, nameservers |
| **Domain Age** | Age breakdown (years/months/days) with expiry countdown |
| **IP Geolocation** | Location, ISP, ASN with embedded OpenStreetMap |
| **ASN Lookup** | AS details, organization, IPv4 prefixes via BGPView |
| **IP to Domain** | Reverse IP lookup to find hosted domains |

### 🌍 Network Tools (3)
| Tool | Description |
|------|-------------|
| **HTTP Headers** | Security header analysis (HSTS, CSP, X-Frame-Options) |
| **SSL/TLS Checker** | Certificate details via Certificate Transparency (crt.sh) |
| **Website Status** | Up/down check with response time measurement |

### 🎨 UX Features
- ⌨️ **Command Palette** — `Ctrl+K` to search and navigate all tools instantly
- 🌗 **Dark/Light Mode** — Auto-detects system preference, persists choice
- 📋 **Click-to-Copy** — Click any IP, hostname, or value to copy
- 💀 **Skeleton Loading** — Smooth loading states with shimmer animations
- ✨ **Stagger Animations** — Results appear with cascading fade-in
- 🍞 **Toast Notifications** — Non-intrusive feedback for actions
- 📱 **Fully Responsive** — Mobile-first design with collapsible navbar

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/checkhub.git
cd checkhub

# Install dependencies
npm install

# Start development server
npm run dev
# → http://localhost:3000

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 🏗️ Architecture

```
Vite SPA (Vanilla JS) — No Framework Overhead
├── Custom History API Router (17 routes, page transitions)
├── CSS Custom Properties Design System (dark/light tokens)
├── Client-side DNS-over-HTTPS (Google + Cloudflare DoH)
├── RDAP Protocol for WHOIS (no API key needed)
├── SessionStorage Cache (5min TTL for DNS, 1hr for WHOIS)
└── Zero backend for DNS tools (100% client-side)
```

### APIs Used (All Free, No Keys Required)
| API | Used For | Limit |
|-----|----------|-------|
| [Google DNS-over-HTTPS](https://dns.google) | DNS queries, propagation | Unlimited |
| [Cloudflare DoH](https://cloudflare-dns.com) | DNS fallback resolver | Unlimited |
| [RDAP](https://rdap.org) | WHOIS / Domain Age | Unlimited |
| [ip-api.com](http://ip-api.com) | IP Geolocation | 45 req/min |
| [BGPView](https://bgpview.io) | ASN Lookup | Unlimited |
| [crt.sh](https://crt.sh) | SSL Certificate Transparency | Unlimited |

---

## 📁 Project Structure

```
checkhub/
├── index.html                    # SPA entry point
├── package.json                  # Dependencies & scripts
├── vite.config.js                # Vite configuration
├── public/
│   └── favicon.svg               # Brand favicon (gradient D)
├── src/
│   ├── main.js                   # App bootstrap & route registration
│   ├── router.js                 # History API SPA router
│   ├── styles/
│   │   ├── index.css             # CSS reset, animations, utilities
│   │   ├── themes.css            # Dark/light design tokens
│   │   ├── layout.css            # Navbar, footer, page sections
│   │   └── components.css        # Search bar, tables, cards, palette
│   ├── components/
│   │   ├── navbar.js             # Glassmorphism navbar + dropdowns
│   │   ├── footer.js             # Site footer
│   │   ├── theme-toggle.js       # Dark/light mode toggle
│   │   ├── command-palette.js    # Ctrl+K fuzzy search palette
│   │   ├── search-bar.js         # Reusable search input component
│   │   ├── results-table.js      # DNS propagation results table
│   │   ├── loading-skeleton.js   # Shimmer loading skeletons
│   │   ├── toast.js              # Toast notification system
│   │   └── copy-button.js        # Click-to-copy utility
│   ├── pages/
│   │   ├── home.js               # DNS Propagation Checker (homepage)
│   │   ├── dns-lookup.js         # DNS Lookup
│   │   ├── reverse-dns.js        # Reverse DNS
│   │   ├── dns-compare.js        # DNS Record Compare
│   │   ├── dnssec-check.js       # DNSSEC Checker
│   │   ├── ns-lookup.js          # NS Lookup
│   │   ├── mx-lookup.js          # MX Lookup
│   │   ├── txt-lookup.js         # TXT Lookup
│   │   ├── public-dns.js         # Public DNS List
│   │   ├── whois.js              # WHOIS Lookup
│   │   ├── domain-age.js         # Domain Age Checker
│   │   ├── ip-geolocation.js     # IP Geolocation
│   │   ├── asn-lookup.js         # ASN Lookup
│   │   ├── ip-to-domain.js       # IP to Domain
│   │   ├── http-headers.js       # HTTP Headers Check
│   │   ├── ssl-checker.js        # SSL/TLS Checker
│   │   └── website-status.js     # Website Status Checker
│   ├── services/
│   │   └── dns-api.js            # Google + Cloudflare DoH service
│   ├── utils/
│   │   ├── constants.js          # Tool definitions & record types
│   │   ├── cache.js              # SessionStorage cache with TTL
│   │   └── validators.js         # Domain & IP validation
│   └── data/
│       └── dns-servers.json      # 20 global DNS servers for propagation
└── docs/
    └── specs/                    # Design specifications
```

---

## 🎨 Design System

### Color Tokens
| Token | Light | Dark |
|-------|-------|------|
| Primary | `#2563eb` | `#3b82f6` |
| Accent | `#06b6d4` | `#22d3ee` |
| Success | `#10b981` | `#34d399` |
| Error | `#ef4444` | `#f87171` |
| Warning | `#f59e0b` | `#fbbf24` |

### Typography
- **UI Font:** [Inter](https://fonts.google.com/specimen/Inter) (400, 500, 600, 700)
- **Mono Font:** [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) (400, 500)

### Effects
- Glassmorphism navbar with `backdrop-filter: blur(16px)`
- Smooth page transitions (200ms fade + slide)
- Stagger animations on result rows (50ms delay per item)
- Shimmer skeleton loading states

---

## 🌐 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Netlify
```bash
npm run build
# Upload dist/ folder to Netlify
```

### Docker
```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

---

## 📊 Performance

- **Bundle Size:** ~50KB (gzipped) — no framework overhead
- **LCP Target:** < 1.5s
- **CLS:** < 0.1
- **DNS Queries:** Client-side DoH (no server round-trip)
- **Caching:** SessionStorage with configurable TTL

---

## 🗺️ Roadmap

- [ ] Interactive SVG world map for DNS propagation
- [ ] Export results as JSON/CSV
- [ ] Shareable URLs with auto-query (`/dns-lookup/google.com/A`)
- [ ] Serverless functions for WHOIS proxy (expanded data)
- [ ] PWA support (offline access for cached results)
- [ ] i18n (multi-language support)

---

## 📄 License

MIT License — Free for personal and commercial use.

---

<p align="center">
  <strong>CheckHub</strong> — Built with ⚡ Vite + Vanilla JS<br>
  No ads. No tracking. No frameworks. Just tools.
</p>
