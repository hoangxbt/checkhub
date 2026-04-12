// src/main.js
import './styles/index.css';
import './styles/themes.css';
import './styles/layout.css';
import './styles/components.css';
import { Router, interceptLinks } from './router.js';
import { initTheme } from './components/theme-toggle.js';
import { renderNavbar } from './components/navbar.js';
import { renderFooter } from './components/footer.js';
import { initCommandPalette } from './components/command-palette.js';

// Pages
import { renderHome } from './pages/home.js';
import { renderDnsLookup } from './pages/dns-lookup.js';
import { renderReverseDns } from './pages/reverse-dns.js';
import { renderDnsCompare } from './pages/dns-compare.js';
import { renderDnssecCheck } from './pages/dnssec-check.js';
import { renderNsLookup } from './pages/ns-lookup.js';
import { renderMxLookup } from './pages/mx-lookup.js';
import { renderTxtLookup } from './pages/txt-lookup.js';
import { renderPublicDns } from './pages/public-dns.js';
import { renderWhois } from './pages/whois.js';
import { renderDomainAge } from './pages/domain-age.js';
import { renderIpGeolocation } from './pages/ip-geolocation.js';
import { renderAsnLookup } from './pages/asn-lookup.js';
import { renderIpToDomain } from './pages/ip-to-domain.js';
import { renderHttpHeaders } from './pages/http-headers.js';
import { renderSslChecker } from './pages/ssl-checker.js';
import { renderWebsiteStatus } from './pages/website-status.js';
import { renderMyIp } from './pages/my-ip.js';
import { renderSpfDmarc } from './pages/spf-dmarc.js';
import { renderDomainHealth } from './pages/domain-health.js';
import { renderPasswordGenerator } from './pages/password-generator.js';
import { render2FAGenerator } from './pages/2fa-generator.js';
import { renderBase64 } from './pages/base64.js';
import { renderUrlEncode } from './pages/url-encode.js';
import { renderJsonFormatter } from './pages/json-formatter.js';
import { renderRegexTester } from './pages/regex-tester.js';
import { renderJwtDecoder } from './pages/jwt-decoder.js';
import { renderHashGenerator } from './pages/hash-generator.js';
import { renderUuidGenerator } from './pages/uuid-generator.js';
import { renderTimestampConverter } from './pages/timestamp-converter.js';
import { renderMacLookup } from './pages/mac-lookup.js';
import { renderSubnetCalc } from './pages/subnet-calc.js';
import { renderPortScanner } from './pages/port-scanner.js';
import { renderPingTest } from './pages/ping-test.js';
import { renderCronParser } from './pages/cron-parser.js';
import { renderSslDecoder } from './pages/ssl-decoder.js';
import { renderDiffChecker } from './pages/diff-checker.js';

initTheme();
const router = new Router();

document.addEventListener('DOMContentLoaded', () => {
  renderNavbar(document.getElementById('navbar'));
  renderFooter(document.getElementById('footer'));

  router
    // DNS Tools
    .add('/', renderHome)
    .add('/dns-lookup', renderDnsLookup)
    .add('/reverse-dns', renderReverseDns)
    .add('/dns-compare', renderDnsCompare)
    .add('/dnssec-check', renderDnssecCheck)
    .add('/ns-lookup', renderNsLookup)
    .add('/mx-lookup', renderMxLookup)
    .add('/txt-lookup', renderTxtLookup)
    .add('/public-dns', renderPublicDns)
    // Domain Intelligence
    .add('/whois', renderWhois)
    .add('/domain-age', renderDomainAge)
    .add('/ip-geolocation', renderIpGeolocation)
    .add('/asn-lookup', renderAsnLookup)
    .add('/ip-to-domain', renderIpToDomain)
    // Network Tools
    .add('/http-headers', renderHttpHeaders)
    .add('/ssl-checker', renderSslChecker)
    .add('/website-status', renderWebsiteStatus)
    // New Tools
    .add('/my-ip', renderMyIp)
    .add('/spf-dmarc', renderSpfDmarc)
    .add('/domain-health', renderDomainHealth)
    // Utility Tools
    .add('/password-generator', renderPasswordGenerator)
    .add('/2fa', render2FAGenerator)
    .add('/base64', renderBase64)
    .add('/url-encode', renderUrlEncode)
    .add('/json-formatter', renderJsonFormatter)
    .add('/regex-tester', renderRegexTester)
    .add('/jwt-decoder', renderJwtDecoder)
    .add('/hash-generator', renderHashGenerator)
    .add('/uuid-generator', renderUuidGenerator)
    .add('/timestamp', renderTimestampConverter)
    .add('/mac-lookup', renderMacLookup)
    .add('/subnet-calc', renderSubnetCalc)
    .add('/port-scanner', renderPortScanner)
    .add('/ping-test', renderPingTest)
    .add('/cron-parser', renderCronParser)
    .add('/ssl-decoder', renderSslDecoder)
    .add('/diff-checker', renderDiffChecker);

  router.init('#main-content');
  interceptLinks(router);
  initCommandPalette(router);
});

window.__router = router;
