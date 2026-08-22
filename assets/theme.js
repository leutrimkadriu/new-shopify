(() => {
  const live = (message) => { const node = document.getElementById('nx-live-region'); if (node) node.textContent = message; };
  const events = new EventTarget();
  const focusable = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  class NxDrawer extends HTMLElement {
    connectedCallback() {
      this.panel = this.querySelector('[data-panel]');
      document.querySelectorAll(`[data-open="${this.id}"]`).forEach((button) => button.addEventListener('click', () => this.open(button)));
      this.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', () => this.close()));
      this.addEventListener('keydown', (event) => this.onKeydown(event));
    }
    open(trigger) { this.trigger = trigger; this.setAttribute('open', ''); document.body.classList.add('nx-locked'); this.querySelector(focusable)?.focus(); }
    close() { this.removeAttribute('open'); document.body.classList.remove('nx-locked'); this.trigger?.focus(); }
    onKeydown(event) {
      if (event.key === 'Escape') this.close();
      if (event.key !== 'Tab') return;
      const nodes = [...this.querySelectorAll(focusable)]; const first = nodes[0]; const last = nodes.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  }
  class NxModal extends NxDrawer {
    open(trigger) { super.open(trigger); this.setAttribute('role', 'dialog'); this.setAttribute('aria-modal', 'true'); }
  }
  class NxDisclosure extends HTMLElement {
    connectedCallback() { this.querySelector('summary')?.addEventListener('click', () => requestAnimationFrame(() => this.dispatchEvent(new CustomEvent('nx:toggle')))); }
  }
  class NxAnnouncement extends HTMLElement {
    connectedCallback() {
      const items = [...this.querySelectorAll('[data-announcement]')]; const delay = Number(this.dataset.speed || 6) * 1000; let index = 0;
      this.querySelector('[data-dismiss]')?.addEventListener('click', () => { sessionStorage.setItem(`nx-announcement-${this.dataset.id}`, 'dismissed'); this.hidden = true; });
      if (sessionStorage.getItem(`nx-announcement-${this.dataset.id}`)) this.hidden = true;
      if (items.length > 1 && !matchMedia('(prefers-reduced-motion: reduce)').matches) this.timer = setInterval(() => { items[index].hidden = true; index = (index + 1) % items.length; items[index].hidden = false; }, delay);
    }
    disconnectedCallback() { clearInterval(this.timer); }
  }
  class NxCountdown extends HTMLElement {
    connectedCallback() { this.end = new Date(this.dataset.end).getTime(); if (!this.end) return; this.tick(); this.timer = setInterval(() => this.tick(), 1000); }
    tick() { const remaining = this.end - Date.now(); if (remaining <= 0) { clearInterval(this.timer); this.innerHTML = `<span>${this.dataset.expired || ''}</span>`; return; } const days = Math.floor(remaining / 864e5); const hours = Math.floor(remaining / 36e5) % 24; const minutes = Math.floor(remaining / 6e4) % 60; const seconds = Math.floor(remaining / 1000) % 60; this.querySelector('[data-days]').textContent = days; this.querySelector('[data-hours]').textContent = String(hours).padStart(2,'0'); this.querySelector('[data-minutes]').textContent = String(minutes).padStart(2,'0'); this.querySelector('[data-seconds]').textContent = String(seconds).padStart(2,'0'); }
    disconnectedCallback() { clearInterval(this.timer); }
  }
  class NxRail extends HTMLElement {
    connectedCallback() { this.scroller = this.querySelector('[data-rail]'); this.progress = this.querySelector('[data-progress]'); this.scroller?.addEventListener('scroll', () => requestAnimationFrame(() => this.update()), { passive:true }); this.update(); }
    update() { if (!this.scroller || !this.progress) return; const max = this.scroller.scrollWidth - this.scroller.clientWidth; this.progress.style.setProperty('--rail-progress', `${max ? 15 + (this.scroller.scrollLeft / max) * 85 : 100}%`); }
  }
  customElements.define('nx-drawer', NxDrawer); customElements.define('nx-modal', NxModal); customElements.define('nx-disclosure', NxDisclosure); customElements.define('nx-announcement', NxAnnouncement); customElements.define('nx-countdown', NxCountdown); customElements.define('nx-rail', NxRail);
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => entry.isIntersecting && (entry.target.classList.add('is-visible'), observer.unobserve(entry.target))), { rootMargin:'0px 0px -8% 0px' });
  const observe = (root = document) => root.querySelectorAll('.nx-reveal').forEach((el) => observer.observe(el)); observe();
  const transparentHeader = document.querySelector('.nx-header-wrap.is-transparent');
  if (transparentHeader) {
    const updateHeader = () => transparentHeader.classList.toggle('is-scrolled', scrollY > 24);
    updateHeader(); window.addEventListener('scroll', updateHeader, { passive:true });
  }
  const headerDetails = [...document.querySelectorAll('.nx-header__nav details')];
  if (headerDetails.length) {
    document.addEventListener('click', (event) => headerDetails.forEach((details) => {
      if (details.open && !details.contains(event.target)) details.open = false;
    }));
    headerDetails.forEach((details) => details.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') { details.open = false; details.querySelector('summary')?.focus(); }
    }));
  }
  document.addEventListener('shopify:section:load', (event) => observe(event.target));
  document.querySelectorAll('[data-localization-select]').forEach((select) => select.addEventListener('change', () => select.form.submit()));
  window.NXTheme = { events, live };
})();
