(() => {
  if (!window.NXTheme) return;
  const { define, live } = window.NXTheme;

  class NxPickupAvailability extends HTMLElement {
    connectedCallback() {
      if (this.initialized) return;
      this.initialized = true;
      this.form = document.getElementById(this.dataset.form);
      this.onVariantChange = (event) => this.load(event.target.value);
      this.onClick = (event) => {
        if (event.target.closest('[data-pickup-open]')) this.querySelector('[data-pickup-dialog]')?.showModal();
        if (event.target.closest('[data-pickup-close]')) this.querySelector('[data-pickup-dialog]')?.close();
      };
      this.form?.querySelector('[name="id"]')?.addEventListener('change', this.onVariantChange);
      this.addEventListener('click', this.onClick);
      this.load(this.dataset.variantId);
    }

    async load(variantId) {
      const sequence = (this.requestSequence || 0) + 1;
      this.requestSequence = sequence;
      this.controller?.abort();
      this.replaceChildren();
      this.hidden = true;
      if (!variantId) { this.removeAttribute('aria-busy'); return; }
      this.controller = new AbortController();
      this.setAttribute('aria-busy', 'true');
      try {
        const root = this.dataset.rootUrl.endsWith('/') ? this.dataset.rootUrl : `${this.dataset.rootUrl}/`;
        const response = await fetch(`${root}variants/${variantId}/?section_id=pickup-availability`, { signal: this.controller.signal });
        if (!response.ok) throw new Error(this.dataset.error);
        const documentFragment = new DOMParser().parseFromString(await response.text(), 'text/html');
        if (sequence !== this.requestSequence) return;
        const content = documentFragment.querySelector('[data-pickup-content]');
        if (!content || content.hidden) { this.replaceChildren(); this.hidden = true; return; }
        this.innerHTML = content.innerHTML;
        this.hidden = false;
        this.dataset.variantId = variantId;
      } catch (error) {
        if (error.name !== 'AbortError' && sequence === this.requestSequence) {
          const message = document.createElement('p');
          message.className = 'nx-muted';
          message.textContent = error.message;
          this.replaceChildren(message);
          this.hidden = false;
          live(error.message);
        }
      } finally {
        if (sequence === this.requestSequence) this.removeAttribute('aria-busy');
      }
    }

    disconnectedCallback() {
      this.controller?.abort();
      this.form?.querySelector('[name="id"]')?.removeEventListener('change', this.onVariantChange);
      this.removeEventListener('click', this.onClick);
    }
  }

  define('nx-pickup-availability', NxPickupAvailability);
})();
