(() => {
  const toggle = document.querySelector('.nav-toggle');
  const sidebar = document.querySelector('.sidebar');
  const search = document.querySelector('#doc-search');
  const sections = [...document.querySelectorAll('.doc-section:not(.hero)')];
  const noResults = document.querySelector('#no-results');

  const closeNavigation = () => {
    if (!toggle || !sidebar) return;
    toggle.setAttribute('aria-expanded', 'false');
    sidebar.classList.remove('is-open');
    document.body.classList.remove('nav-open');
  };

  toggle?.addEventListener('click', () => {
    const opening = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(opening));
    sidebar?.classList.toggle('is-open', opening);
    document.body.classList.toggle('nav-open', opening);
  });

  sidebar?.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeNavigation();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeNavigation();
    if (event.key === '/' && search && document.activeElement !== search && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '')) {
      event.preventDefault();
      search.focus();
    }
  });

  search?.addEventListener('input', () => {
    const query = search.value.trim().toLowerCase();
    let matches = 0;
    sections.forEach((section) => {
      const haystack = `${section.dataset.search || ''} ${section.textContent}`.toLowerCase();
      const visible = !query || haystack.includes(query);
      section.hidden = !visible;
      if (visible) matches += 1;
    });
    if (noResults) noResults.hidden = matches !== 0;
  });

  const links = [...document.querySelectorAll('.section-nav a[href^="#"]')];
  if ('IntersectionObserver' in window && links.length) {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      links.forEach((link) => link.removeAttribute('aria-current'));
      document.querySelector(`.section-nav a[href="#${visible.target.id}"]`)?.setAttribute('aria-current', 'location');
    }, { rootMargin: '-20% 0px -65%', threshold: [0, .25, .5] });
    sections.forEach((section) => observer.observe(section));
  }

  document.querySelectorAll('[data-year]').forEach((node) => { node.textContent = String(new Date().getFullYear()); });
})();
