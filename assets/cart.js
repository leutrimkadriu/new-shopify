(() => {
  if (!window.NXTheme) return;
  const { events, live } = window.NXTheme;
  const request = async (url, options = {}) => { const response = await fetch(url, { ...options, headers:{ Accept:'application/json', 'X-Requested-With':'XMLHttpRequest', ...options.headers } }); const data = await response.json(); if (!response.ok) throw new Error(data.description || data.message || window.NX.strings.error); return data; };
  class NxProductForm extends HTMLElement {
    connectedCallback() { this.form = this.querySelector('form'); this.form?.addEventListener('submit', (event) => this.submit(event)); }
    async submit(event) { event.preventDefault(); const button = this.form.querySelector('[type="submit"]'); button.disabled = true; button.setAttribute('aria-busy','true'); try { const data = await request(`${window.NX.routes.cartAdd}.js`, { method:'POST', body:new FormData(this.form) }); events.dispatchEvent(new CustomEvent('cart:changed', { detail:data })); live(window.NX.strings.added); document.getElementById('NxCartDrawer')?.open(button); } catch (error) { live(error.message); const errorNode = this.querySelector('[data-error]'); if (errorNode) errorNode.textContent = error.message; } finally { button.disabled = false; button.removeAttribute('aria-busy'); } }
  }
  class NxCartDrawer extends customElements.get('nx-drawer') {
    connectedCallback() { super.connectedCallback(); events.addEventListener('cart:changed', () => this.refresh()); this.addEventListener('change', (event) => { if (event.target.matches('[data-cart-quantity]')) this.change(event.target.dataset.line, event.target.value); }); this.addEventListener('click', (event) => { const control = event.target.closest('[data-quantity-action]'); if (control) { const input = this.querySelector(`[data-cart-quantity][data-line="${control.dataset.line}"]`); this.change(control.dataset.line, Math.max(0, Number(input.value) + Number(control.dataset.delta))); } }); }
    async refresh() { try { const html = await fetch(`${window.NX.routes.cart}?section_id=cart-drawer`).then((response) => response.text()); const parsed = new DOMParser().parseFromString(html,'text/html').querySelector('#NxCartDrawer'); if (parsed) this.innerHTML = parsed.innerHTML; const cart = await request(`${window.NX.routes.cart}.js`); document.querySelectorAll('[data-cart-count]').forEach((node) => { node.textContent = cart.item_count; node.hidden = cart.item_count === 0; }); } catch (error) { live(error.message); } }
    async change(line, quantity) { try { await request(`${window.NX.routes.cartChange}.js`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ line:Number(line), quantity:Number(quantity) }) }); await this.refresh(); live(window.NX.strings.added); } catch (error) { live(error.message); } }
  }
  customElements.define('nx-product-form', NxProductForm); customElements.define('nx-cart-drawer', NxCartDrawer);
})();
