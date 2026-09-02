(() => {
  if (!window.NXTheme || !window.NX) return;
  const { define, events, live } = window.NXTheme;
  const jsonHeaders = { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' };
  const jsonRoute = (route) => route.endsWith('.js') ? route : `${route}.js`;
  let mutationQueue = Promise.resolve();
  let pendingMutations = 0;

  const request = async (url, options = {}) => {
    const response = await fetch(url, { ...options, headers: { ...jsonHeaders, ...options.headers } });
    const text = await response.text();
    let data = {};
    try { data = text ? JSON.parse(text) : {}; } catch (_) { data = {}; }
    if (!response.ok) throw new Error(data.description || data.message || window.NX.strings.error);
    return data;
  };

  const setCartCount = (count, animate = false) => {
    document.querySelectorAll('[data-cart-count]').forEach((badge) => {
      badge.textContent = count;
      badge.hidden = count < 1;
      if (animate) {
        badge.classList.remove('is-updated');
        requestAnimationFrame(() => badge.classList.add('is-updated'));
        setTimeout(() => badge.classList.remove('is-updated'), 400);
      }
    });
  };

  const publish = (cart, animate = false) => {
    setCartCount(Number(cart.item_count || 0), animate);
    events.dispatchEvent(new CustomEvent('cart:updated', { detail: { cart } }));
    document.dispatchEvent(new CustomEvent('nx:cart-updated', { detail: { cart } }));
    return cart;
  };

  const replaceCartDrawer = (html) => {
    if (!html) return false;
    const replacement = new DOMParser().parseFromString(html, 'text/html').querySelector('#NxCartDrawer');
    const drawer = document.getElementById('NxCartDrawer');
    if (!replacement || !drawer) return false;
    drawer.innerHTML = replacement.innerHTML;
    drawer.panel = drawer.querySelector('[data-panel]');
    return true;
  };

  const fetchCartDrawer = async () => {
    if (!document.getElementById('NxCartDrawer')) return;
    const separator = window.NX.routes.cart.includes('?') ? '&' : '?';
    const response = await fetch(`${window.NX.routes.cart}${separator}sections=cart-drawer`, { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
    if (!response.ok) throw new Error(window.NX.strings.error);
    const sections = await response.json();
    if (!replaceCartDrawer(sections['cart-drawer'])) throw new Error(window.NX.strings.error);
  };

  const renderBundledDrawer = async (sections) => {
    if (!document.getElementById('NxCartDrawer')) return;
    if (!replaceCartDrawer(sections?.['cart-drawer'])) await fetchCartDrawer();
  };

  const enqueue = (operation) => {
    pendingMutations += 1;
    const result = mutationQueue.catch(() => {}).then(operation).finally(() => { pendingMutations -= 1; });
    mutationQueue = result;
    return result;
  };

  const whenCartIsIdle = async () => {
    while (pendingMutations > 0) await mutationQueue;
  };

  const CartAPI = {
    get: () => request(jsonRoute(window.NX.routes.cart)),
    async add(formData) {
      return enqueue(async () => {
        const payload = new FormData();
        formData.forEach((value, key) => payload.append(key, value));
        payload.set('sections', 'cart-drawer');
        payload.set('sections_url', window.location.pathname);
        const quantity = Math.max(1, Number(payload.get('quantity') || 1));
        const item = await request(jsonRoute(window.NX.routes.cartAdd), { method: 'POST', body: payload });
        const current = Number(document.querySelector('[data-cart-count]')?.textContent || 0);
        setCartCount(current + quantity, true);
        await renderBundledDrawer(item.sections);
        const cart = publish(await this.get(), false);
        return { item, cart };
      });
    },
    async change(key, quantity) {
      return enqueue(async () => {
        const cart = await request(jsonRoute(window.NX.routes.cartChange), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: key, quantity: Math.max(0, Number(quantity) || 0), sections: ['cart-drawer'], sections_url: window.location.pathname })
        });
        publish(cart, true);
        await renderBundledDrawer(cart.sections);
        return cart;
      });
    },
    async update(formData) {
      return enqueue(async () => {
        const payload = new FormData();
        formData.forEach((value, key) => payload.append(key, value));
        payload.set('sections', 'cart-drawer');
        payload.set('sections_url', window.location.pathname);
        const cart = await request(jsonRoute(window.NX.routes.cartUpdate), { method: 'POST', body: payload });
        publish(cart, true);
        await renderBundledDrawer(cart.sections);
        return cart;
      });
    },
    async sync() {
      const [cart] = await Promise.all([this.get().then((state) => publish(state, false)), fetchCartDrawer()]);
      return cart;
    },
    whenIdle: whenCartIsIdle,
    renderDrawer: fetchCartDrawer
  };
  window.NXTheme.cart = CartAPI;

  const continueCheckoutWhenCartIsIdle = (event) => {
    if (event.submitter?.name !== 'checkout' || pendingMutations === 0) return;
    event.preventDefault();
    const owner = event.target.closest('nx-cart-page, nx-cart-drawer');
    const ownerId = owner?.id;
    const submitter = event.submitter;
    submitter.disabled = true;
    submitter.setAttribute('aria-busy', 'true');
    CartAPI.whenIdle()
      .then(() => {
        const currentOwner = ownerId ? document.getElementById(ownerId) : null;
        const currentSubmitter = currentOwner?.querySelector('button[name="checkout"]');
        if (!currentSubmitter?.form) throw new Error(window.NX.strings.error);
        currentSubmitter.disabled = false;
        currentSubmitter.removeAttribute('aria-busy');
        currentSubmitter.form.requestSubmit(currentSubmitter);
      })
      .catch((error) => {
        live(error.message || window.NX.strings.error);
        const currentOwner = ownerId ? document.getElementById(ownerId) : null;
        const currentSubmitter = currentOwner?.querySelector('button[name="checkout"]');
        if (currentSubmitter) {
          currentSubmitter.disabled = false;
          currentSubmitter.removeAttribute('aria-busy');
        }
      });
  };

  class NxProductForm extends HTMLElement {
    connectedCallback() {
      this.form = this.querySelector('form');
      if (!this.form || this.initialized) return;
      this.initialized = true;
      this.form.addEventListener('submit', (event) => this.submit(event));
    }
    async submit(event) {
      const submitter = event.submitter;
      if (!submitter?.matches('[data-product-submit]')) return;
      event.preventDefault();
      if (this.loading) return;
      const button = submitter || this.form.querySelector('[data-product-submit]');
      const variant = this.form.querySelector('[name="id"]');
      if (!button || button.disabled || !variant?.value) { live(window.NX.strings.error); return; }
      this.loading = true;
      button.disabled = true;
      button.setAttribute('aria-busy', 'true');
      const errorNode = this.querySelector('[data-error]');
      if (errorNode) errorNode.textContent = '';
      try {
        const formData = new FormData(this.form);
        const quantityInput = [...document.querySelectorAll('[data-product-quantity]')].find((input) => input.form === this.form);
        if (quantityInput) formData.set('quantity', String(Math.max(1, Number(quantityInput.value) || 1)));
        await CartAPI.add(formData);
        live(window.NX.strings.added);
        document.getElementById('NxCartDrawer')?.open(button);
      } catch (error) {
        live(error.message);
        if (errorNode) errorNode.textContent = error.message;
      } finally {
        this.loading = false;
        button.disabled = button.dataset.available === 'false';
        button.removeAttribute('aria-busy');
      }
    }
  }

  class NxCartDrawer extends customElements.get('nx-drawer') {
    connectedCallback() {
      super.connectedCallback();
      this.setAttribute('role', 'dialog');
      this.setAttribute('aria-modal', 'true');
      if (this.cartInitialized) return;
      this.cartInitialized = true;
      this.addEventListener('submit', continueCheckoutWhenCartIsIdle);
      this.addEventListener('change', (event) => {
        if (event.target.matches('[data-cart-quantity]')) {
          const quantity = Math.max(1, Math.round(Number(event.target.value) || 1));
          event.target.value = quantity;
          this.change(event.target.dataset.cartKey, quantity);
        }
      });
      this.addEventListener('click', (event) => {
        const remove = event.target.closest('[data-cart-remove]');
        const control = event.target.closest('[data-quantity-action]');
        if (!remove && !control) return;
        event.preventDefault();
        if (remove) { this.change(remove.dataset.cartKey, 0, remove); return; }
        const input = [...this.querySelectorAll('[data-cart-quantity]')].find((node) => node.dataset.cartKey === control.dataset.cartKey);
        if (input) {
          const quantity = Math.max(0, Number(input.value) + Number(control.dataset.delta));
          input.value = quantity;
          this.change(control.dataset.cartKey, quantity, control);
        }
      });
    }
    async refresh() { return CartAPI.sync(); }
    async change(key, quantity, control) {
      this.pending = (this.pending || 0) + 1;
      this.setAttribute('aria-busy', 'true');
      if (control) control.setAttribute('aria-disabled', 'true');
      try { await CartAPI.change(key, quantity); live(window.NX.strings.added); }
      catch (error) { live(error.message); }
      finally {
        this.pending -= 1;
        if (this.pending === 0) this.removeAttribute('aria-busy');
        if (control?.isConnected) control.removeAttribute('aria-disabled');
      }
    }
  }

  class NxCartPage extends HTMLElement {
    connectedCallback() {
      if (this.initialized) return;
      this.initialized = true;
      this.addEventListener('click', (event) => {
        const remove = event.target.closest('[data-cart-remove]');
        const control = event.target.closest('[data-quantity-action]');
        if (!remove && !control) return;
        event.preventDefault();
        if (remove) { this.change(remove.dataset.cartKey, 0); return; }
        const input = [...this.querySelectorAll('[data-cart-quantity]')].find((node) => node.dataset.cartKey === control.dataset.cartKey);
        if (input) {
          const quantity = Math.max(0, Number(input.value) + Number(control.dataset.delta));
          input.value = quantity;
          this.change(control.dataset.cartKey, quantity);
        }
      });
      this.addEventListener('change', (event) => {
        if (event.target.matches('[data-cart-quantity]')) {
          const quantity = Math.max(1, Math.round(Number(event.target.value) || 1));
          event.target.value = quantity;
          this.change(event.target.dataset.cartKey, quantity);
        }
      });
      this.addEventListener('submit', (event) => {
        if (event.submitter?.name === 'checkout') { continueCheckoutWhenCartIsIdle(event); return; }
        if (event.submitter?.name !== 'update') return;
        event.preventDefault();
        this.update(new FormData(event.target));
      });
    }
    async change(key, quantity) {
      this.pending = (this.pending || 0) + 1;
      this.setAttribute('aria-busy', 'true');
      try { await CartAPI.change(key, quantity); await this.render(); }
      catch (error) { live(error.message); }
      finally { this.pending -= 1; if (this.pending === 0) this.removeAttribute('aria-busy'); }
    }
    async update(formData) {
      this.pending = (this.pending || 0) + 1;
      this.setAttribute('aria-busy', 'true');
      try { await CartAPI.update(formData); await this.render(); }
      catch (error) { live(error.message); }
      finally { this.pending -= 1; if (this.pending === 0) this.removeAttribute('aria-busy'); }
    }
    async render() {
      const separator = window.NX.routes.cart.includes('?') ? '&' : '?';
      const response = await fetch(`${window.NX.routes.cart}${separator}section_id=${encodeURIComponent(this.dataset.sectionId)}`, { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
      if (!response.ok) throw new Error(window.NX.strings.error);
      const replacement = new DOMParser().parseFromString(await response.text(), 'text/html').querySelector('#NxCartPage');
      if (replacement) this.innerHTML = replacement.innerHTML;
    }
  }

  define('nx-product-form', NxProductForm);
  define('nx-cart-drawer', NxCartDrawer);
  define('nx-cart-page', NxCartPage);
})();
