// src/router.js
export class Router {
  constructor() {
    this.routes = new Map();
    this.currentRoute = null;
    this.contentEl = null;
    window.addEventListener('popstate', () => this.resolve());
  }
  init(contentSelector) { this.contentEl = document.querySelector(contentSelector); this.resolve(); }
  add(path, handler) { this.routes.set(path, handler); return this; }
  navigate(path) {
    if (path === this.currentRoute) return;
    window.history.pushState(null, '', path);
    this.resolve();
  }
  resolve() {
    const path = window.location.pathname || '/';
    this.currentRoute = path;
    let handler = this.routes.get(path);
    if (!handler) {
      for (const [routePath, routeHandler] of this.routes) {
        const params = this.matchRoute(routePath, path);
        if (params) { handler = () => routeHandler(params); break; }
      }
    }
    if (!handler) handler = this.routes.get('/');
    if (handler && this.contentEl) {
      this.contentEl.style.opacity = '0';
      this.contentEl.style.transform = 'translateY(8px)';
      setTimeout(() => {
        this.contentEl.innerHTML = '';
        const content = handler();
        if (typeof content === 'string') this.contentEl.innerHTML = content;
        else if (content instanceof HTMLElement) this.contentEl.appendChild(content);
        document.querySelectorAll('.navbar-link, .navbar-dropdown-item').forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === path);
        });
        this.contentEl.style.opacity = '1';
        this.contentEl.style.transform = 'translateY(0)';
        this.contentEl.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  }
  matchRoute(routePath, actualPath) {
    const rp = routePath.split('/'), ap = actualPath.split('/');
    if (rp.length !== ap.length) return null;
    const params = {};
    for (let i = 0; i < rp.length; i++) {
      if (rp[i].startsWith(':')) params[rp[i].slice(1)] = ap[i];
      else if (rp[i] !== ap[i]) return null;
    }
    return params;
  }
}

export function interceptLinks(router) {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) return;
    e.preventDefault();
    router.navigate(href);
    document.querySelectorAll('.navbar-dropdown.open').forEach(d => d.classList.remove('open'));
    document.querySelector('.navbar-menu')?.classList.remove('open');
  });
}
