(() => {
  const events = new EventTarget();
  const focusableSelector = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  const define = (name, constructor) => { if (!customElements.get(name)) customElements.define(name, constructor); };
  const live = (message) => {
    const region = document.getElementById('nx-live-region');
    if (!region) return;
    region.textContent = '';
    requestAnimationFrame(() => { region.textContent = message || ''; });
  };

  class NxDrawer extends HTMLElement {
    connectedCallback() {
      this.panel = this.querySelector('[data-panel]');
      if (this.initialized) return;
      this.initialized = true;
      this.addEventListener('click', (event) => {
        if (event.target.closest('[data-close]')) this.close();
      });
      this.addEventListener('keydown', (event) => this.onKeydown(event));
    }

    open(trigger) {
      this.trigger = trigger || document.activeElement;
      this.setAttribute('open', '');
      document.body.classList.add('nx-locked');
      requestAnimationFrame(() => (this.panel?.querySelector(focusableSelector) || this.panel)?.focus());
    }

    close() {
      if (!this.hasAttribute('open')) return;
      this.removeAttribute('open');
      if (!document.querySelector('.nx-drawer[open], .nx-modal[open]')) document.body.classList.remove('nx-locked');
      this.trigger?.focus?.();
    }

    onKeydown(event) {
      if (event.key === 'Escape') { event.preventDefault(); this.close(); return; }
      if (event.key !== 'Tab' || !this.panel) return;
      const nodes = [...this.panel.querySelectorAll(focusableSelector)].filter((node) => node.offsetParent !== null);
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  }

  class NxModal extends NxDrawer {
    connectedCallback() { super.connectedCallback(); this.setAttribute('role', 'dialog'); this.setAttribute('aria-modal', 'true'); }
  }

  class NxDisclosure extends HTMLElement {
    connectedCallback() {
      if (this.initialized) return;
      this.initialized = true;
      this.querySelector('summary')?.addEventListener('click', () => requestAnimationFrame(() => this.dispatchEvent(new CustomEvent('nx:toggle'))));
    }
  }

  class NxAnnouncement extends HTMLElement {
    connectedCallback() {
      if (this.initialized) return;
      this.initialized = true;
      this.items = [...this.querySelectorAll('[data-announcement]')];
      this.index = 0;
      if (sessionStorage.getItem(`nx-announcement-${this.dataset.id}`)) this.hidden = true;
      this.querySelector('[data-dismiss]')?.addEventListener('click', () => {
        sessionStorage.setItem(`nx-announcement-${this.dataset.id}`, 'dismissed');
        this.hidden = true;
      });
      if (this.items.length > 1 && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        this.timer = setInterval(() => {
          this.items[this.index].hidden = true;
          this.index = (this.index + 1) % this.items.length;
          this.items[this.index].hidden = false;
        }, Number(this.dataset.speed || 6) * 1000);
      }
    }
    disconnectedCallback() { clearInterval(this.timer); }
  }

  class NxCountdown extends HTMLElement {
    connectedCallback() {
      this.end = new Date(this.dataset.end).getTime();
      if (!Number.isFinite(this.end)) return;
      this.tick();
      this.timer = setInterval(() => this.tick(), 1000);
    }
    tick() {
      const remaining = this.end - Date.now();
      if (remaining <= 0) { clearInterval(this.timer); this.textContent = this.dataset.expired || ''; return; }
      const values = { days: Math.floor(remaining / 864e5), hours: Math.floor(remaining / 36e5) % 24, minutes: Math.floor(remaining / 6e4) % 60, seconds: Math.floor(remaining / 1000) % 60 };
      Object.entries(values).forEach(([key, value]) => { const node = this.querySelector(`[data-${key}]`); if (node) node.textContent = key === 'days' ? value : String(value).padStart(2, '0'); });
    }
    disconnectedCallback() { clearInterval(this.timer); }
  }

  class NxRail extends HTMLElement {
    connectedCallback() {
      this.scroller = this.querySelector('[data-rail]');
      this.progress = this.querySelector('[data-progress]');
      if (!this.scroller || this.initialized) return;
      this.initialized = true;
      this.scroller.addEventListener('scroll', () => requestAnimationFrame(() => this.update()), { passive: true });
      new ResizeObserver(() => this.update()).observe(this.scroller);
      this.update();
    }
    update() { const max = this.scroller.scrollWidth - this.scroller.clientWidth; if (this.progress) this.progress.style.setProperty('--rail-progress', `${max > 0 ? 15 + (this.scroller.scrollLeft / max) * 85 : 100}%`); }
  }

  define('nx-drawer', NxDrawer);
  define('nx-modal', NxModal);
  define('nx-disclosure', NxDisclosure);
  define('nx-announcement', NxAnnouncement);
  define('nx-countdown', NxCountdown);
  define('nx-rail', NxRail);

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-open]');
    if (!trigger) return;
    const target = document.getElementById(trigger.dataset.open);
    if (typeof target?.open === 'function') { event.preventDefault(); target.open(trigger); }
  });

  document.addEventListener('change', (event) => {
    if (event.target.matches('[data-localization-select]')) event.target.form?.requestSubmit();
  });

  const observeReveals = (root = document) => {
    const elements = root.querySelectorAll('.nx-reveal:not(.is-visible)');
    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) { elements.forEach((element) => element.classList.add('is-visible')); return; }
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
    }), { rootMargin: '0px 0px -8% 0px' });
    elements.forEach((element) => observer.observe(element));
  };
  observeReveals();
  document.addEventListener('shopify:section:load', (event) => observeReveals(event.target));

  const transparentHeader = document.querySelector('.nx-header-wrap.is-transparent');
  if (transparentHeader) {
    const update = () => transparentHeader.classList.toggle('is-scrolled', scrollY > 24);
    update();
    window.addEventListener('scroll', update, { passive: true });
  }

  document.addEventListener('click', (event) => document.querySelectorAll('.nx-header__nav details[open]').forEach((details) => {
    if (!details.contains(event.target)) details.open = false;
  }));
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    document.querySelectorAll('.nx-header__nav details[open]').forEach((details) => { details.open = false; details.querySelector('summary')?.focus(); });
  });

  window.NXTheme = { define, events, live };
})();
