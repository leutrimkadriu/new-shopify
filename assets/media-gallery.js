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
        const media = this.querySelector(`[data-media-id="${button.dataset.thumbnail}"]`);
        if (!media) return;
        this.querySelectorAll('[data-thumbnail]').forEach((item) => item.removeAttribute('aria-current'));
        button.setAttribute('aria-current', 'true');
        media.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
      });
    }
  }
  define('nx-media-gallery', NxMediaGallery);
})();
