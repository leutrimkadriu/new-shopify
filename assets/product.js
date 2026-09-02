(() => {
  if (!window.NXTheme || !window.NX) return;
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
      if (!this.form || this.initialized) return;
      this.initialized = true;
      this.root = this.closest('[data-product-section]') || document;
      this.stableMarkup = this.innerHTML;
      this.requestSequence = 0;
      this.onChange = (event) => this.update(event);
      this.addEventListener('change', this.onChange);
    }

    selectedOptionValueIds() {
      return [...this.querySelectorAll('fieldset, .nx-variant-select')]
        .map((group) => group.querySelector('input:checked, select')?.matches('select')
          ? group.querySelector('select')?.selectedOptions[0]?.dataset.optionValueId
          : group.querySelector('input:checked')?.dataset.optionValueId)
        .filter(Boolean);
    }

    parseSelectedVariant(picker) {
      try { return JSON.parse(picker.querySelector('[data-selected-variant]')?.textContent || 'null'); }
      catch (_) { return null; }
    }

    setLoading(loading) {
      this.toggleAttribute('aria-busy', loading);
      this.root.querySelectorAll('.nx-dynamic-checkout').forEach((checkout) => {
        checkout.toggleAttribute('inert', loading);
        checkout.toggleAttribute('aria-busy', loading);
      });
      const button = this.form.querySelector('[data-product-submit]');
      if (button) {
        button.toggleAttribute('aria-busy', loading);
        button.disabled = loading || button.dataset.available === 'false';
      }
      document.querySelectorAll(`[data-sticky-submit="${this.dataset.section}"]`).forEach((sticky) => {
        sticky.disabled = loading || button?.dataset.available === 'false';
      });
    }

    async update(event) {
      const changedControl = event?.target.matches('select') ? event.target.selectedOptions[0] : event?.target;
      if (changedControl?.dataset.productUrl) {
        window.location.assign(changedControl.dataset.productUrl);
        return;
      }
      const optionValueIds = this.selectedOptionValueIds();
      if (!optionValueIds.length) return;
      const sequence = ++this.requestSequence;
      this.controller?.abort();
      this.controller = new AbortController();
      this.setLoading(true);
      const requestUrl = new URL(this.dataset.productUrl || this.root.dataset.productUrl || location.pathname, location.origin);
      requestUrl.searchParams.set('section_id', this.dataset.section);
      requestUrl.searchParams.set('option_values', optionValueIds.join(','));
      try {
        const response = await fetch(requestUrl, {
          signal: this.controller.signal,
          headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        if (!response.ok) throw new Error(window.NX.strings.error);
        const responseDocument = new DOMParser().parseFromString(await response.text(), 'text/html');
        if (sequence !== this.requestSequence) return;
        const responseRoot = [...responseDocument.querySelectorAll('[data-product-section]')]
          .find((node) => node.dataset.productSection === this.dataset.section);
        const responsePicker = responseRoot?.querySelector('nx-variant-selects');
        if (!responseRoot || !responsePicker) throw new Error(window.NX.strings.error);
        const variant = this.parseSelectedVariant(responsePicker);
        this.innerHTML = responsePicker.innerHTML;
        this.stableMarkup = this.innerHTML;
        this.applyVariant(variant, responseRoot, responseDocument);
      } catch (error) {
        if (error.name === 'AbortError' || sequence !== this.requestSequence) return;
        this.innerHTML = this.stableMarkup;
        live(error.message);
      } finally {
        if (sequence === this.requestSequence) this.setLoading(false);
      }
    }

    applyVariant(variant, responseRoot, responseDocument) {
      const idInput = this.form.querySelector('[name="id"]');
      const button = this.form.querySelector('[data-product-submit]');
      if (!variant) {
        idInput.value = '';
        idInput.dispatchEvent(new Event('change', { bubbles: true }));
        this.root.querySelectorAll('[data-payment-terms-variant]').forEach((input) => { input.value = ''; input.dispatchEvent(new Event('change', { bubbles: true })); });
        if (button) { button.disabled = true; button.dataset.available = 'false'; button.textContent = button.dataset.unavailable; }
        this.root.querySelectorAll('[data-price-for], [data-sku], [data-inventory]').forEach((node) => { node.hidden = true; });
        document.querySelectorAll(`[data-price-for="${this.dataset.section}"]`).forEach((node) => {
          if (!this.root.contains(node)) node.hidden = true;
        });
        const selectedLabels = [...this.querySelectorAll('input:checked, select')]
          .map((control) => control.matches('select') ? control.selectedOptions[0]?.textContent.trim() : control.value)
          .filter(Boolean)
          .join(' / ');
        document.querySelectorAll(`[data-variant-label="${this.dataset.section}"]`).forEach((node) => { node.textContent = selectedLabels; });
        document.querySelectorAll(`[data-sticky-submit="${this.dataset.section}"]`).forEach((sticky) => {
          sticky.disabled = true;
          sticky.textContent = button?.dataset.unavailable || '';
        });
        return;
      }
      idInput.value = variant.id;
      idInput.dispatchEvent(new Event('change', { bubbles: true }));
      this.root.querySelectorAll('[data-payment-terms-variant]').forEach((input) => { input.value = variant.id; input.dispatchEvent(new Event('change', { bubbles: true })); });
      const responseButton = responseRoot.querySelector('[data-product-submit]');
      if (button) {
        button.disabled = !variant.available;
        button.dataset.available = String(variant.available);
        button.textContent = responseButton?.textContent.trim() || (variant.available ? button.dataset.add : button.dataset.sold);
      }
      document.querySelectorAll(`[data-sticky-submit="${this.dataset.section}"]`).forEach((sticky) => {
        sticky.disabled = !variant.available;
        sticky.textContent = variant.available ? button?.dataset.add : button?.dataset.sold;
      });

      const copy = (selector) => {
        const source = responseRoot.querySelector(selector);
        const destination = this.root.querySelector(selector);
        if (!source || !destination) return;
        destination.innerHTML = source.innerHTML;
        destination.hidden = source.hidden;
      };
      copy(`[data-price-for="${this.dataset.section}"]`);
      copy('[data-sku]');
      copy('[data-inventory]');

      document.querySelectorAll(`[data-variant-label="${this.dataset.section}"]`).forEach((node) => { node.textContent = variant.title; });
      if (this.root.hasAttribute('data-update-product-url')) {
        const url = new URL(this.root.dataset.productUrl || location.pathname, location.origin);
        url.searchParams.set('variant', variant.id);
        history.replaceState({}, '', `${url.pathname}${url.search}`);
      }
      if (variant.featured_media) {
        const gallery = this.root.querySelector('nx-media-gallery');
        if (typeof gallery?.select === 'function') gallery.select(variant.featured_media.id);
        else this.root.querySelector(`[data-media-id="${variant.featured_media.id}"]`)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
      }

      const responseStickyPrice = [...responseDocument.querySelectorAll('[data-price-for]')]
        .find((node) => node.dataset.priceFor === this.dataset.section && !responseRoot.contains(node));
      const stickyPrice = [...document.querySelectorAll('[data-price-for]')]
        .find((node) => node.dataset.priceFor === this.dataset.section && !this.root.contains(node));
      if (responseStickyPrice && stickyPrice) {
        stickyPrice.innerHTML = responseStickyPrice.innerHTML;
        stickyPrice.hidden = false;
      }
    }

    disconnectedCallback() {
      this.controller?.abort();
      this.removeEventListener('change', this.onChange);
    }
  }

  class NxGiftRecipient extends HTMLElement {
    connectedCallback() {
      if (this.initialized || this.hasAttribute('data-no-script')) return;
      this.initialized = true;
      this.toggle = this.querySelector('[data-recipient-toggle]');
      this.fields = this.querySelector('[data-recipient-fields]');
      if (!this.toggle || !this.fields) return;
      this.onChange = () => this.update();
      this.toggle.addEventListener('change', this.onChange);
      this.update();
    }

    update() {
      const enabled = this.toggle.checked;
      this.fields.hidden = !enabled;
      this.fields.querySelectorAll('input, textarea, select').forEach((field) => { field.disabled = !enabled; });
      if (enabled) {
        const date = this.querySelector('[data-recipient-send-on]');
        const offset = this.querySelector('[data-recipient-offset]');
        const today = new Date();
        const latest = new Date(today);
        latest.setDate(latest.getDate() + 90);
        const toISODate = (value) => new Date(value.getTime() - value.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
        if (date) { date.min = toISODate(today); date.max = toISODate(latest); }
        if (offset) offset.value = String(today.getTimezoneOffset());
      }
    }

    disconnectedCallback() { this.toggle?.removeEventListener('change', this.onChange); }
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
  define('nx-gift-recipient', NxGiftRecipient);
  define('nx-sticky-cart', NxStickyCart);
  define('product-recommendations', NxProductRecommendations);
})();
