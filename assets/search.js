(() => {
  if (!window.NXTheme) return;
  const { define, live } = window.NXTheme;

  class NxPredictiveSearch extends HTMLElement {
    connectedCallback() {
      this.input = this.querySelector('input');
      this.results = this.querySelector('[data-results]');
      if (!this.input || !this.results || this.initialized) return;
      this.initialized = true;
      this.input.setAttribute('aria-autocomplete', 'list');
      this.input.setAttribute('aria-controls', 'predictive-search-results');
      this.input.addEventListener('input', () => {
        clearTimeout(this.timer);
        this.timer = setTimeout(() => this.search(), 220);
      });
    }
    async search() {
      const query = this.input.value.trim();
      this.controller?.abort();
      if (query.length < 2) { this.results.innerHTML = ''; this.removeAttribute('aria-busy'); return; }
      this.controller = new AbortController();
      this.setAttribute('aria-busy', 'true');
      try {
        const url = `${window.NX.routes.predictive}?q=${encodeURIComponent(query)}&resources[type]=product,collection,page,article&resources[limit]=6&section_id=predictive-search`;
        const response = await fetch(url, { signal: this.controller.signal });
        if (!response.ok) throw new Error(window.NX.strings.error);
        this.results.innerHTML = await response.text();
      } catch (error) { if (error.name !== 'AbortError') live(error.message); }
      finally { this.removeAttribute('aria-busy'); }
    }
    disconnectedCallback() { clearTimeout(this.timer); this.controller?.abort(); }
  }
  define('nx-predictive-search', NxPredictiveSearch);
})();
