(() => {
  if (!window.NXTheme) return;
  const { define, live } = window.NXTheme;

  class NxPredictiveSearch extends HTMLElement {
    connectedCallback() {
      this.input = this.querySelector('input');
      this.results = this.querySelector('[data-results]');
      if (!this.input || !this.results || this.initialized) return;
      this.initialized = true;
      if (this.dataset.enabled !== 'true') return;
      this.input.setAttribute('role', 'combobox');
      this.input.setAttribute('aria-autocomplete', 'list');
      this.input.setAttribute('aria-controls', 'predictive-search-results');
      this.input.setAttribute('aria-expanded', 'false');
      this.input.addEventListener('input', () => {
        clearTimeout(this.timer);
        this.timer = setTimeout(() => this.search(), 220);
      });
      this.addEventListener('keydown', (event) => this.onKeydown(event));
      if (this.input.value.trim().length >= 2) this.search();
    }
    async search() {
      const query = this.input.value.trim();
      const sequence = (this.requestSequence || 0) + 1;
      this.requestSequence = sequence;
      this.controller?.abort();
      if (query.length < 2) { this.results.innerHTML = ''; this.input.setAttribute('aria-expanded', 'false'); this.removeAttribute('aria-busy'); return; }
      this.controller = new AbortController();
      this.setAttribute('aria-busy', 'true');
      try {
        const url = `${window.NX.routes.predictive}?q=${encodeURIComponent(query)}&resources[type]=product,collection,page,article&resources[limit]=6&section_id=predictive-search`;
        const response = await fetch(url, { signal: this.controller.signal });
        if (!response.ok) throw new Error(window.NX.strings.error);
        const responseText = await response.text();
        if (sequence !== this.requestSequence) return;
        this.results.innerHTML = responseText;
        this.input.setAttribute('aria-expanded', String(Boolean(this.results.querySelector('a'))));
      } catch (error) { if (error.name !== 'AbortError' && sequence === this.requestSequence) live(error.message); }
      finally { if (sequence === this.requestSequence) this.removeAttribute('aria-busy'); }
    }
    onKeydown(event) {
      const links = [...this.results.querySelectorAll('a')];
      if (!links.length) return;
      const current = links.indexOf(document.activeElement);
      if (event.key === 'ArrowDown') { event.preventDefault(); links[Math.min(current + 1, links.length - 1)].focus(); }
      if (event.key === 'ArrowUp') { event.preventDefault(); if (current <= 0) this.input.focus(); else links[current - 1].focus(); }
      if (event.key === 'Escape') { this.results.innerHTML = ''; this.input.setAttribute('aria-expanded', 'false'); this.input.focus(); }
    }
    disconnectedCallback() { clearTimeout(this.timer); this.controller?.abort(); }
  }
  define('nx-predictive-search', NxPredictiveSearch);
})();
