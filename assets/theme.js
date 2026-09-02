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
  const loadScript = (src) => {
    if (!src) return;
    const absoluteSrc = new URL(src, document.baseURI).href;
    if ([...document.scripts].some((script) => script.src === absoluteSrc)) return;
    const script = document.createElement('script');
    script.src = src;
    script.defer = true;
    document.head.appendChild(script);
  };
  const loadDeferredScript = (root) => {
    const host = root?.matches?.('[data-deferred-script]') ? root : root?.querySelector?.('[data-deferred-script]');
    const src = host?.dataset.deferredScript;
    if (!src || host.dataset.scriptRequested === 'true') return;
    host.dataset.scriptRequested = 'true';
    loadScript(src);
  };
  const ensureComponentScripts = (root) => {
    const contains = (selector) => root?.matches?.(selector) || root?.querySelector?.(selector);
    if (contains('nx-product-form, nx-cart-drawer, nx-cart-page')) loadScript(window.NX?.scripts?.cart);
    if (contains('[data-product-section]')) loadScript(window.NX?.scripts?.product);
    if (contains('nx-media-gallery')) loadScript(window.NX?.scripts?.media);
    if (contains('nx-pickup-availability')) loadScript(window.NX?.scripts?.pickup);
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
      this.trigger?.setAttribute?.('aria-expanded', 'true');
      document.body.classList.add('nx-locked');
      requestAnimationFrame(() => (this.panel?.querySelector(focusableSelector) || this.panel)?.focus());
    }

    close() {
      if (!this.hasAttribute('open')) return;
      this.removeAttribute('open');
      this.trigger?.setAttribute?.('aria-expanded', 'false');
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

    disconnectedCallback() {
      this.trigger?.setAttribute?.('aria-expanded', 'false');
      if (!document.querySelector('.nx-drawer[open], .nx-modal[open]')) document.body.classList.remove('nx-locked');
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
        this.stop();
        this.hidden = true;
      });
      if (this.dataset.rotate === 'true' && this.items.length > 1 && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        this.addEventListener('mouseenter', () => this.stop());
        this.addEventListener('mouseleave', () => this.start());
        this.addEventListener('focusin', () => this.stop());
        this.addEventListener('focusout', () => this.start());
        this.start();
      }
      this.onBlockSelect = (event) => {
        const item = event.target.closest?.('[data-announcement]');
        if (!item || !this.contains(item)) return;
        this.stop();
        this.items.forEach((announcement) => { announcement.hidden = announcement !== item; });
        this.index = this.items.indexOf(item);
      };
      this.onBlockDeselect = (event) => {
        if (this.contains(event.target)) this.start();
      };
      document.addEventListener('shopify:block:select', this.onBlockSelect);
      document.addEventListener('shopify:block:deselect', this.onBlockDeselect);
    }
    start() {
      if (this.timer || this.hidden) return;
      this.timer = setInterval(() => {
        this.items[this.index].hidden = true;
        this.index = (this.index + 1) % this.items.length;
        this.items[this.index].hidden = false;
      }, Number(this.dataset.speed || 6) * 1000);
    }
    stop() { clearInterval(this.timer); this.timer = null; }
    disconnectedCallback() {
      this.stop();
      document.removeEventListener('shopify:block:select', this.onBlockSelect);
      document.removeEventListener('shopify:block:deselect', this.onBlockDeselect);
    }
  }

  class NxRail extends HTMLElement {
    connectedCallback() {
      this.scroller = this.querySelector('[data-rail]');
      this.progress = this.querySelector('[data-progress]');
      if (!this.scroller || this.initialized) return;
      this.initialized = true;
      this.scroller.addEventListener('scroll', () => {
        if (this.frame) return;
        this.frame = requestAnimationFrame(() => { this.frame = null; this.update(); });
      }, { passive: true });
      this.resizeObserver = new ResizeObserver(() => this.update());
      this.resizeObserver.observe(this.scroller);
      this.update();
    }
    update() { const max = this.scroller.scrollWidth - this.scroller.clientWidth; if (this.progress) this.progress.style.setProperty('--rail-progress-scale', String(max > 0 ? .15 + (this.scroller.scrollLeft / max) * .85 : 1)); }
    disconnectedCallback() { this.resizeObserver?.disconnect(); if (this.frame) cancelAnimationFrame(this.frame); }
  }

  class NxSlideshow extends HTMLElement {
    connectedCallback() {
      this.slides = [...this.querySelectorAll('[data-slide]')];
      if (this.initialized || this.slides.length < 1) return;
      this.initialized = true;
      this.index = Math.max(0, this.slides.findIndex((slide) => !slide.hidden));
      this.status = this.querySelector('[data-slide-status]');
      this.toggle = this.querySelector('[data-slide-toggle]');
      this.paused = matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.updateLiveRegions();
      this.addEventListener('click', (event) => {
        if (event.target.closest('[data-slide-previous]')) this.show(this.index - 1, true);
        if (event.target.closest('[data-slide-next]')) this.show(this.index + 1, true);
        if (event.target.closest('[data-slide-toggle]')) this.toggleAutoplay();
      });
      this.addEventListener('mouseenter', () => this.stop());
      this.addEventListener('mouseleave', () => this.start());
      this.addEventListener('focusin', () => this.stop());
      this.addEventListener('focusout', (event) => { if (!this.contains(event.relatedTarget)) this.start(); });
      this.onBlockSelect = (event) => {
        const slide = event.target.closest?.('[data-slide]');
        if (!slide || !this.contains(slide)) return;
        this.stop();
        this.show(this.slides.indexOf(slide));
      };
      document.addEventListener('shopify:block:select', this.onBlockSelect);
      this.show(this.index);
      this.start();
    }
    show(index, restart = false) {
      if (!this.slides.length) return;
      this.index = (index + this.slides.length) % this.slides.length;
      this.slides.forEach((slide, slideIndex) => { slide.hidden = slideIndex !== this.index; });
      if (this.status) this.status.textContent = `${this.index + 1} / ${this.slides.length}`;
      if (restart) { this.stop(); this.start(); }
    }
    start() {
      if (this.dataset.autoplay !== 'true' || this.paused || this.timer || this.slides.length < 2) return;
      this.timer = setInterval(() => this.show(this.index + 1), Math.max(4, Number(this.dataset.speed || 6)) * 1000);
    }
    stop() { clearInterval(this.timer); this.timer = null; }
    updateLiveRegions() {
      const politeness = this.dataset.autoplay === 'true' && !this.paused ? 'off' : 'polite';
      this.querySelectorAll('[data-slide-live]').forEach((region) => region.setAttribute('aria-live', politeness));
    }
    toggleAutoplay() {
      this.paused = !this.paused;
      this.updateLiveRegions();
      if (this.toggle) {
        this.toggle.setAttribute('aria-label', this.paused ? this.toggle.dataset.play : this.toggle.dataset.pause);
        this.toggle.innerHTML = this.paused ? '<svg class="nx-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7V5Z"/></svg>' : '<svg class="nx-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14"/></svg>';
      }
      if (this.paused) this.stop(); else this.start();
    }
    disconnectedCallback() { this.stop(); document.removeEventListener('shopify:block:select', this.onBlockSelect); }
  }

  define('nx-drawer', NxDrawer);
  define('nx-modal', NxModal);
  define('nx-disclosure', NxDisclosure);
  define('nx-announcement', NxAnnouncement);
  define('nx-rail', NxRail);
  define('nx-slideshow', NxSlideshow);

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-open]');
    if (!trigger) return;
    const target = document.getElementById(trigger.dataset.open);
    if (typeof target?.open === 'function') { event.preventDefault(); loadDeferredScript(target); target.open(trigger); }
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
  const headerScrollHandlers = new WeakMap();
  const transparentHeadersIn = (root) => [
    ...(root.matches?.('.nx-header-wrap.is-transparent') ? [root] : []),
    ...root.querySelectorAll('.nx-header-wrap.is-transparent')
  ];
  const initTransparentHeaders = (root = document) => transparentHeadersIn(root).forEach((header) => {
    if (headerScrollHandlers.has(header)) return;
    const update = () => header.classList.toggle('is-scrolled', scrollY > 24);
    let frame = null;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => { frame = null; update(); });
    };
    headerScrollHandlers.set(header, { onScroll, cancel: () => { if (frame) cancelAnimationFrame(frame); } });
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
  });
  const destroyTransparentHeaders = (root) => transparentHeadersIn(root).forEach((header) => {
    const handler = headerScrollHandlers.get(header);
    if (handler) { window.removeEventListener('scroll', handler.onScroll); handler.cancel(); }
    headerScrollHandlers.delete(header);
  });

  observeReveals();
  initTransparentHeaders();
  document.addEventListener('shopify:section:load', (event) => { ensureComponentScripts(event.target); observeReveals(event.target); initTransparentHeaders(event.target); });
  document.addEventListener('shopify:section:unload', (event) => destroyTransparentHeaders(event.target));

  document.addEventListener('click', (event) => document.querySelectorAll('.nx-header__nav details[open]').forEach((details) => {
    if (!details.contains(event.target)) details.open = false;
  }));
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    document.querySelectorAll('.nx-header__nav details[open]').forEach((details) => { details.open = false; details.querySelector('summary')?.focus(); });
  });

  window.NXTheme = { define, events, live };
})();
