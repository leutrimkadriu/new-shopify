(() => {
  if (!window.NXTheme) return;
  const { define, live } = window.NXTheme;

  class NxQuantity extends HTMLElement {
    connectedCallback() {
      this.input = this.querySelector('input[type="number"]');
      if (!this.input || this.initialized) return;
      this.initialized = true;
      this.addEventListener('click', (event) => {
        const minus = event.target.closest('[data-quantity-minus]');
        const plus = event.target.closest('[data-quantity-plus]');
        if (!minus && !plus) return;
        event.preventDefault();
        this.normalize();
        if (minus) this.input.stepDown();
        if (plus) this.input.stepUp();
        this.normalize();
        this.input.dispatchEvent(new Event('input', { bubbles: true }));
      });
      this.input.addEventListener('input', () => this.updateControls());
      this.input.addEventListener('change', () => this.normalize());
      this.input.addEventListener('blur', () => this.normalize());
      this.normalize();
    }
    normalize() {
      const min = Number(this.input.min || 1);
      const max = this.input.max ? Number(this.input.max) : Infinity;
      const value = Number(this.input.value);
      const step = Math.max(1, Number(this.input.step || 1));
      const normalized = Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
      this.input.value = Math.min(max, min + Math.round((normalized - min) / step) * step);
      this.updateControls();
    }
    updateControls() {
      const value = Number(this.input.value);
      const min = Number(this.input.min || 1);
      const max = this.input.max ? Number(this.input.max) : Infinity;
      this.querySelector('[data-quantity-minus]')?.toggleAttribute('disabled', !Number.isFinite(value) || value <= min);
      this.querySelector('[data-quantity-plus]')?.toggleAttribute('disabled', Number.isFinite(value) && value >= max);
    }
  }

  class NxVariantSelects extends HTMLElement {
    connectedCallback() {
      this.form = document.getElementById(this.dataset.form);
      const dataNode = this.querySelector('[type="application/json"]');
      if (!this.form || !dataNode || this.initialized) return;
      this.initialized = true;
      try { this.variants = JSON.parse(dataNode.textContent); }
      catch (error) { live(error.message); return; }
      this.addEventListener('change', () => this.update());
    }
    update() {
      const values = [...this.querySelectorAll('fieldset, .nx-variant-select')].map((group) => group.querySelector('input:checked, select')?.value);
      const variant = this.variants.find((item) => item.options.every((option, index) => option === values[index]));
      const idInput = this.form.querySelector('[name="id"]');
      const button = this.form.querySelector('[data-product-submit]');
      if (!variant) {
        idInput.value = '';
        idInput.dispatchEvent(new Event('change', { bubbles: true }));
        if (button) { button.disabled = true; button.dataset.available = 'false'; button.textContent = button.dataset.unavailable; }
        document.querySelectorAll(`[data-sticky-submit="${this.dataset.section}"]`).forEach((sticky) => { sticky.disabled = true; });
        return;
      }
      idInput.value = variant.id;
      idInput.dispatchEvent(new Event('change', { bubbles: true }));
      if (button) { button.disabled = !variant.available; button.dataset.available = String(variant.available); button.textContent = variant.available ? button.dataset.add : button.dataset.sold; }
      document.querySelectorAll(`[data-sticky-submit="${this.dataset.section}"]`).forEach((sticky) => {
        sticky.disabled = !variant.available;
        sticky.textContent = variant.available ? button?.dataset.add : button?.dataset.sold;
      });
      document.querySelectorAll(`[data-price-for="${this.dataset.section}"]`).forEach((node) => {
        const price = document.querySelector(`[data-variant-price="${variant.id}"]`);
        if (price) node.innerHTML = price.innerHTML;
      });
      document.querySelectorAll(`[data-variant-label="${this.dataset.section}"]`).forEach((node) => { node.textContent = variant.title; });
      const url = new URL(location.href);
      url.searchParams.set('variant', variant.id);
      history.replaceState({}, '', url);
      if (variant.featured_media) document.querySelector(`[data-media-id="${variant.featured_media.id}"]`)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
    }
  }

  class NxStickyCart extends HTMLElement {
    connectedCallback() {
      this.form = document.getElementById(this.dataset.form);
      if (!this.form || this.initialized) return;
      this.initialized = true;
      this.observer = new IntersectionObserver(([entry]) => this.classList.toggle('is-visible', !entry.isIntersecting), { threshold: 0 });
      this.observer.observe(this.form);
      this.querySelector('button')?.addEventListener('click', () => {
        const submit = this.form.querySelector('[data-product-submit]');
        if (submit && !submit.disabled) this.form.requestSubmit(submit);
      });
    }
    disconnectedCallback() { this.observer?.disconnect(); }
  }

  class NxProductRecommendations extends HTMLElement {
    connectedCallback() {
      if (this.dataset.loaded || !this.dataset.url) return;
      const load = () => this.load();
      if (!('IntersectionObserver' in window)) { load(); return; }
      this.observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { this.observer.disconnect(); load(); } }, { rootMargin: '200px' });
      this.observer.observe(this);
    }
    async load() {
      try {
        const response = await fetch(this.dataset.url);
        if (!response.ok) throw new Error(window.NX.strings.error);
        const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
        const candidates = [...doc.querySelectorAll('product-recommendations')];
        const replacement = candidates.find((node) => node.dataset.url === this.dataset.url) || candidates[0];
        if (replacement) { this.innerHTML = replacement.innerHTML; this.dataset.loaded = 'true'; }
      } catch (error) { live(error.message); this.hidden = true; }
    }
    disconnectedCallback() { this.observer?.disconnect(); }
  }

  define('nx-quantity', NxQuantity);
  define('nx-variant-selects', NxVariantSelects);
  define('nx-sticky-cart', NxStickyCart);
  define('product-recommendations', NxProductRecommendations);
})();
