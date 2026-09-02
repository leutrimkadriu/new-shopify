(() => {
  if (!window.NXTheme) return;
  const { define } = window.NXTheme;
  class NxMediaGallery extends HTMLElement {
    connectedCallback() {
      if (this.initialized) return;
      this.initialized = true;
      this.addEventListener('click', (event) => {
        const button = event.target.closest('[data-thumbnail]');
        if (!button) return;
        this.select(button.dataset.thumbnail);
      });
      this.setupModels();
    }

    select(mediaId) {
      const media = this.querySelector(`[data-media-id="${mediaId}"]`);
      if (!media) return;
      this.querySelectorAll('[data-thumbnail]').forEach((item) => item.toggleAttribute('aria-current', item.dataset.thumbnail === String(mediaId)));
      this.querySelectorAll('video').forEach((video) => { if (!media.contains(video)) video.pause(); });
      const xrButton = this.querySelector('[data-shopify-xr]');
      if (xrButton && media.dataset.mediaType === 'model') xrButton.dataset.shopifyModel3dId = String(mediaId);
      media.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
    }

    setupModels() {
      const dataNode = this.querySelector('[data-product-models]');
      if (!dataNode || !window.Shopify?.loadFeatures) return;
      let models = [];
      try { models = JSON.parse(dataNode.textContent); } catch (_) { return; }
      const initialize = () => {
        if (!window.ShopifyXR) {
          document.addEventListener('shopify_xr_initialized', initialize, { once: true });
          return;
        }
        window.ShopifyXR.addModels(models);
        window.ShopifyXR.setupXRElements();
      };
      window.Shopify.loadFeatures([{ name: 'shopify-xr', version: '1.0', onLoad: initialize }]);
    }
  }
  define('nx-media-gallery', NxMediaGallery);
})();
