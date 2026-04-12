// src/components/footer.js
export function renderFooter(container) {
  container.className = 'footer';
  container.innerHTML = `<div class="container">
    <div class="footer-links">
      <a href="/">Home</a><a href="/dns-lookup">DNS Lookup</a>
      <a href="/whois">WHOIS</a><a href="/ip-geolocation">IP Geolocation</a>
    </div>
    <div class="footer-copy">© ${new Date().getFullYear()} CheckHub — Free DNS & Network Tools. No ads, no tracking.</div>
  </div>`;
}
