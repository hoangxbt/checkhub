# Dnscan — Design Specification

**Date:** 2026-04-12
**Status:** Approved
**Project Name:** Dnscan (dnscan.org)

## Overview

Xây dựng một nền tảng tra cứu DNS & Domain Intelligence hiện đại, cạnh tranh trực tiếp với DNSChecker.org. Tập trung vào UI/UX premium vượt trội, không quảng cáo, với bộ công cụ mở rộng hơn đối thủ.

### Goals
- UI/UX hiện đại vượt trội so với DNSChecker.org (glassmorphism, animations, dark/light mode)
- 17 công cụ: 9 DNS core + 5 Domain Intelligence + 3 Bonus tools
- Chi phí vận hành $0 (free APIs + Vercel free tier)
- SEO-first, tập trung traffic trước khi monetize
- Không quảng cáo, không thu phí

### Non-Goals
- Không làm user accounts / authentication
- Không làm API as a service (chưa cần)
- Không làm monitoring / alerting
- Không dùng framework nặng (React, Vue, Angular)

---

## Architecture

### Tech Stack
- **Frontend:** Vite + Vanilla JavaScript (SPA)
- **Styling:** Vanilla CSS with CSS custom properties (design tokens)
- **Routing:** Client-side History API router
- **Backend:** Vercel Serverless Functions (3 functions)
- **Hosting:** Vercel (free tier)
- **APIs:** Google DoH, Cloudflare DoH, ip-api.com, bgpview.io, whoisjson.com

### System Diagram

```
┌─────────────────────────────────────────┐
│           Vite SPA (Vanilla JS)         │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐ │
│  │ Router  │ │ UI Theme │ │  Tools   │ │
│  │(History)│ │(Dark/Light)│ │ Modules │ │
│  └─────────┘ └──────────┘ └──────────┘ │
└──────────────┬──────────────────────────┘
               │
       ┌───────┴────────┐
       ▼                ▼
 ┌───────────┐   ┌──────────────┐
 │Public APIs│   │  Serverless  │
 │(Free/DoH) │   │  Functions   │
 ├───────────┤   ├──────────────┤
 │Google DoH │   │WHOIS Lookup  │
 │CF DoH     │   │SSL Check     │
 │ip-api.com │   │HTTP Check    │
 │bgpview.io │   │              │
 └───────────┘   └──────────────┘
```

---

## Tools (17 total)

### DNS Tools — Core (9 tools)

#### 1. DNS Propagation Checker (Homepage)
- **Input:** Domain name + Record type dropdown (A, AAAA, MX, CNAME, NS, TXT, SOA, PTR, SRV, CAA)
- **Output:** Results from 20+ global DNS servers with status (resolved/not resolved)
- **Visual:** Interactive SVG world map with animated markers showing propagation status
- **API:** Google DoH + Cloudflare DoH, querying from multiple resolver endpoints
- **Special:** Auto-refresh option (configurable interval), shareable URL

#### 2. DNS Lookup
- **Input:** Domain name + Record type selector
- **Output:** Detailed DNS records in table format
- **API:** Google DoH (`dns.google/resolve?name={domain}&type={type}`)

#### 3. Reverse DNS Lookup
- **Input:** IP address (IPv4 or IPv6)
- **Output:** Associated hostname(s)
- **API:** Cloudflare DoH with PTR query type

#### 4. DNS Record Compare ⭐ (NEW — DNSChecker doesn't have this)
- **Input:** Two domain names side-by-side
- **Output:** Comparison table highlighting differences between DNS records
- **API:** Parallel DoH queries for both domains
- **Special:** Color-coded diff view (green = match, red = different)

#### 5. DNSSEC Checker
- **Input:** Domain name
- **Output:** DNSSEC validation status, DS records, RRSIG info
- **API:** Google DoH with `?do=1` (DNSSEC OK flag)

#### 6. NS Lookup
- **Input:** Domain name
- **Output:** Nameserver records with IP addresses and response times
- **API:** DoH with NS query type

#### 7. MX Lookup
- **Input:** Domain name
- **Output:** Mail server records with priority, IP, and PTR
- **API:** DoH with MX query type

#### 8. TXT Record Lookup
- **Input:** Domain name
- **Output:** All TXT records with SPF/DKIM/DMARC analysis highlighting
- **API:** DoH with TXT query type

#### 9. Public DNS List
- **Input:** Search/filter
- **Output:** Searchable, sortable table of public DNS servers worldwide
- **Data:** Static JSON bundled in app (curated list of 50+ DNS servers)
- **Columns:** Provider, IPv4, IPv6, Country, Features (DoH, DoT, DNSSEC), Privacy rating

### Domain Intelligence (5 tools)

#### 10. WHOIS Lookup
- **Input:** Domain name
- **Output:** Registration info (registrar, dates, nameservers, status, contact if available)
- **API:** Serverless function → whoisjson.com API (500 free requests/month)

#### 11. Domain Age Checker
- **Input:** Domain name
- **Output:** Domain age (years, months, days), creation date, expiry date, timeline visualization
- **API:** Parsed from WHOIS data (reuse WHOIS service)

#### 12. IP Geolocation
- **Input:** IP address or domain name
- **Output:** Country, region, city, ISP, coordinates, map pin
- **API:** ip-api.com (free, 45 requests/minute) or ipapi.co (1000/day free)

#### 13. ASN Lookup
- **Input:** IP address or ASN number
- **Output:** ASN details, owner organization, IP prefixes, peers
- **API:** bgpview.io API (free, no key required)

#### 14. IP to Domain (Reverse IP)
- **Input:** IP address
- **Output:** List of domains hosted on that IP
- **API:** Cloudflare DoH (PTR) + hackertarget.com reverse IP API

### Bonus Tools (3 tools)

#### 15. HTTP Headers Check
- **Input:** URL
- **Output:** Full HTTP response headers with security analysis (HSTS, CSP, X-Frame-Options, etc.)
- **API:** Serverless function → fetch URL and return headers
- **Special:** Color-coded security rating per header

#### 16. SSL/TLS Checker
- **Input:** Domain name
- **Output:** Certificate details (issuer, validity, SAN, protocol version, cipher suite)
- **API:** Serverless function → TLS handshake check
- **Special:** Visual certificate chain display, expiry warning

#### 17. Website Status Checker
- **Input:** URL or domain
- **Output:** HTTP status code, response time, redirect chain
- **API:** Serverless function → HEAD request with redirect following
- **Special:** Response time graph if checked multiple times

---

## UI/UX Design

### Design Principles
1. **Premium Feel** — Glassmorphism, smooth animations, no clutter
2. **Adaptive Theme** — Dark mode (default) + Light mode toggle
3. **Speed First** — Skeleton loading, instant results, no page reloads
4. **Accessibility** — Keyboard navigable, screen reader friendly, high contrast
5. **Mobile First** — Fully responsive, touch-friendly

### Layout Structure

```
┌──────────────────────────────────────────────────┐
│  🌐 Dnscan   [DNS Tools ▾] [Domain ▾] [More ▾] 🌙│  Navbar (sticky, glassmorphism, blur)
├──────────────────────────────────────────────────┤
│                                                  │
│        ⚡ [Tool Title]                           │  Hero section (per tool)
│   ┌──────────────────────┐ ┌──┐ ┌────────┐      │
│   │  input field         │ │▾ │ │ Search │      │
│   └──────────────────────┘ └──┘ └────────┘      │
│                                                  │
├──────────────────────────────────────────────────┤
│                                                  │
│              Results Area                        │  Results (varies per tool)
│  (table / map / cards / comparison)              │
│                                                  │
├──────────────────────────────────────────────────┤
│                                                  │
│  🧰 Related Tools (grid of cards)                │  Tool suggestions
│                                                  │
├──────────────────────────────────────────────────┤
│  Footer                                          │
└──────────────────────────────────────────────────┘
```

### Design Tokens

| Token | Light Mode | Dark Mode |
|-------|-----------|-----------|
| `--bg-primary` | `#fafbfc` | `#0a0a0f` |
| `--bg-surface` | `#ffffff` | `#12121a` |
| `--bg-glass` | `rgba(255,255,255,0.7)` | `rgba(18,18,26,0.8)` |
| `--color-primary` | `#2563eb` | `#3b82f6` |
| `--color-accent` | `#06b6d4` | `#22d3ee` |
| `--color-success` | `#10b981` | `#34d399` |
| `--color-error` | `#ef4444` | `#f87171` |
| `--color-warning` | `#f59e0b` | `#fbbf24` |
| `--text-primary` | `#1a1a2e` | `#e2e8f0` |
| `--text-secondary` | `#64748b` | `#94a3b8` |
| `--border` | `rgba(0,0,0,0.08)` | `rgba(255,255,255,0.08)` |
| `--shadow` | `0 4px 24px rgba(0,0,0,0.06)` | `0 4px 24px rgba(0,0,0,0.3)` |
| `--radius` | `12px` | `12px` |
| `--radius-lg` | `16px` | `16px` |

### Typography
- **Font Family:** Inter (Google Fonts)
- **Headings:** 600-700 weight
- **Body:** 400 weight
- **Mono (results):** JetBrains Mono (Google Fonts)
- **Scale:** 14px body, 16px inputs, 24-32px headings

### Interactive Features

1. **Command Palette (Ctrl+K)**
   - Full-screen overlay with search input
   - Fuzzy search across all 17 tools
   - Keyboard navigable (arrow keys + Enter)
   - Recent searches history

2. **One-click Copy**
   - Click any result value to copy to clipboard
   - Toast notification confirms copy
   - Copy icon appears on hover

3. **Export Results**
   - Button in results area
   - Formats: JSON, CSV
   - Downloads as file

4. **Shareable URLs**
   - URL pattern: `/#/tool-name/query`
   - Example: `/#/dns-lookup/google.com/A`
   - Paste URL → auto-runs the query

5. **Theme Toggle**
   - Sun/Moon icon in navbar
   - Smooth transition animation
   - Persists preference in localStorage
   - Defaults to system preference (prefers-color-scheme)

### Animations & Micro-interactions
- **Page transitions:** Fade in/out (200ms)
- **Results loading:** Skeleton shimmer animation
- **Server results:** Stagger animation (each row fades in with 50ms delay)
- **Map markers:** Pulse animation on resolved, red glow on failed
- **Buttons:** Scale on hover (1.02), press effect on click
- **Cards:** Lift shadow on hover with subtle border glow
- **Toast notifications:** Slide in from top-right, auto-dismiss 3s
- **Theme toggle:** Rotate icon 360° on switch

---

## Data Flow

### DNS Query Flow
```
User Input → Validate (domain/IP format)
           → Update URL hash
           → Show skeleton loading
           → Call DoH API(s) in parallel
           → Cache results (sessionStorage, 5 min TTL)
           → Render results (table + map)
           → Enable copy/export buttons
```

### Caching Strategy
| Data Type | Storage | TTL |
|-----------|---------|-----|
| DNS results | sessionStorage | 5 minutes |
| WHOIS data | sessionStorage | 1 hour |
| GeoIP data | sessionStorage | 1 hour |
| ASN data | sessionStorage | 1 hour |
| Theme preference | localStorage | Permanent |
| Recent searches | localStorage | Permanent (max 20) |

### Error Handling
- **Network error:** Show retry button + cached result if available
- **Rate limit (429):** Show countdown timer, fallback to alternate API
- **Invalid input:** Inline validation message below input
- **API down:** Graceful degradation, try alternate API endpoint

---

## API Details

### Client-side APIs (no proxy needed)

**Google DNS-over-HTTPS:**
```
GET https://dns.google/resolve?name={domain}&type={type}
Response: { "Answer": [{ "name": "...", "type": 1, "TTL": 300, "data": "93.184.216.34" }] }
```

**Cloudflare DNS-over-HTTPS:**
```
GET https://cloudflare-dns.com/dns-query?name={domain}&type={type}
Headers: { "Accept": "application/dns-json" }
```

**ip-api.com (Geolocation):**
```
GET http://ip-api.com/json/{ip}?fields=status,message,country,regionName,city,lat,lon,isp,org,as,asname
```

**bgpview.io (ASN):**
```
GET https://api.bgpview.io/asn/{asn}
GET https://api.bgpview.io/ip/{ip}
```

### Serverless Functions (Vercel)

**`/api/whois.js`**
- Proxies to whoisjson.com
- Input: `?domain=example.com`
- Rate limit: 500 req/month (free tier)
- Fallback: Parse raw WHOIS text from alternative sources

**`/api/ssl-check.js`**
- Performs TLS handshake to target domain
- Input: `?domain=example.com`
- Returns: Certificate chain, validity, cipher, protocol

**`/api/http-check.js`**
- Fetches HTTP headers from target URL
- Input: `?url=https://example.com`
- Returns: Status code, headers, redirect chain, response time

---

## Project Structure

```
dns-tools/
├── index.html
├── vite.config.js
├── package.json
├── public/
│   ├── favicon.svg
│   └── world-map.svg
├── src/
│   ├── main.js
│   ├── router.js
│   ├── styles/
│   │   ├── index.css
│   │   ├── components.css
│   │   ├── layout.css
│   │   └── themes.css
│   ├── components/
│   │   ├── navbar.js
│   │   ├── footer.js
│   │   ├── search-bar.js
│   │   ├── results-table.js
│   │   ├── results-map.js
│   │   ├── tool-card.js
│   │   ├── theme-toggle.js
│   │   ├── command-palette.js
│   │   ├── copy-button.js
│   │   └── loading-skeleton.js
│   ├── pages/
│   │   ├── home.js
│   │   ├── dns-lookup.js
│   │   ├── reverse-dns.js
│   │   ├── dns-compare.js
│   │   ├── dnssec-check.js
│   │   ├── ns-lookup.js
│   │   ├── mx-lookup.js
│   │   ├── txt-lookup.js
│   │   ├── public-dns.js
│   │   ├── whois.js
│   │   ├── domain-age.js
│   │   ├── ip-geolocation.js
│   │   ├── asn-lookup.js
│   │   ├── ip-to-domain.js
│   │   ├── http-headers.js
│   │   ├── ssl-checker.js
│   │   └── website-status.js
│   ├── services/
│   │   ├── dns-api.js
│   │   ├── whois-api.js
│   │   ├── geo-api.js
│   │   ├── asn-api.js
│   │   └── network-api.js
│   ├── utils/
│   │   ├── cache.js
│   │   ├── validators.js
│   │   ├── formatters.js
│   │   ├── export.js
│   │   └── constants.js
│   └── data/
│       ├── dns-servers.json
│       └── record-types.json
└── api/
    ├── whois.js
    ├── ssl-check.js
    └── http-check.js
```

---

## SEO Strategy

- **Unique title + meta description** per tool page
- **Semantic HTML5** elements (main, section, article, nav)
- **Single `<h1>`** per page
- **Structured data** (JSON-LD) for each tool
- **Clean URLs:** `/#/dns-lookup`, `/#/whois`, etc.
- **Pre-rendering** for static content (Vite prerender plugin)
- **sitemap.xml** + **robots.txt**
- **Open Graph + Twitter Card** meta tags for social sharing
- **Fast Core Web Vitals:** Target LCP < 1.5s, CLS < 0.1

---

## Implementation Priority

### Phase 1 — Foundation (MVP)
1. Project setup (Vite, CSS design system, router)
2. Navbar + Footer + Theme toggle
3. DNS Propagation Checker (homepage) with world map
4. DNS Lookup
5. Command Palette

### Phase 2 — DNS Tools
6. Reverse DNS, NS Lookup, MX Lookup, TXT Lookup
7. DNSSEC Checker
8. DNS Record Compare
9. Public DNS List

### Phase 3 — Domain Intelligence
10. WHOIS Lookup + Domain Age (serverless function)
11. IP Geolocation
12. ASN Lookup
13. IP to Domain

### Phase 4 — Bonus & Polish
14. HTTP Headers Check (serverless function)
15. SSL/TLS Checker (serverless function)
16. Website Status Checker
17. Export, shareable URLs, final polish
