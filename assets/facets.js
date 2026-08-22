(() => {
  if (!window.NXTheme) return;
  const { define, live } = window.NXTheme;

  class NxFacets extends HTMLElement {
    connectedCallback() {
      if (this.initialized) return;
      this.initialized = true;
      this.addEventListener('change', (event) => {
        if (event.target.closest('#NxFilterDrawer')) return;
        this.submit(event.target.closest('form'));
      });
      this.addEventListener('submit', (event) => {
        const form = event.target.closest('form');
        if (!form) return;
        event.preventDefault();
        this.submit(form);
      });
      this.popstateHandler = () => this.render(location.href, false);
      window.addEventListener('popstate', this.popstateHandler);
    }
    disconnectedCallback() { window.removeEventListener('popstate', this.popstateHandler); this.controller?.abort(); }
    async submit(form) {
      if (!form) return;
      const url = `${location.pathname}?${new URLSearchParams(new FormData(form))}`;
      history.pushState({}, '', url);
      await this.render(url, true);
    }
    async render(url, scroll) {
      this.controller?.abort();
      this.controller = new AbortController();
      this.setAttribute('aria-busy', 'true');
      try {
        const response = await fetch(url, { signal: this.controller.signal, headers: { 'X-Requested-With': 'XMLHttpRequest' } });
        if (!response.ok) throw new Error(window.NX.strings.error);
        const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
        const nextFacets = doc.getElementById('NxFacets');
        const nextGrid = doc.getElementById('NxProductGrid');
        if (nextFacets) this.innerHTML = nextFacets.innerHTML;
        if (nextGrid) document.getElementById('NxProductGrid').innerHTML = nextGrid.innerHTML;
        document.body.classList.remove('nx-locked');
        if (scroll) document.getElementById('NxProductGrid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch (error) { if (error.name !== 'AbortError') live(error.message); }
      finally { this.removeAttribute('aria-busy'); }
    }
  }
  define('nx-facets', NxFacets);
})();
