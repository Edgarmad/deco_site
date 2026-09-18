(() => {
  const doc = document;
  const root = doc.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const revealSelector = '[data-reveal]';
  let revealObserver;
  let raf = 0;

  root.classList.add('motion-ready');

  const applyStagger = () => {
    doc.querySelectorAll('[data-reveal-group]').forEach((group) => {
      const items = [...group.querySelectorAll(':scope > [data-reveal], :scope > * [data-reveal]')];
      items.forEach((item, index) => item.style.setProperty('--motion-delay', `${index * 70}ms`));
    });
  };

  const showAll = () => {
    doc.querySelectorAll(revealSelector).forEach((item) => item.classList.add('is-visible'));
  };

  const initReveals = () => {
    revealObserver?.disconnect();
    if (reduced.matches || !('IntersectionObserver' in window)) {
      showAll();
      return;
    }
    revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    doc.querySelectorAll(revealSelector).forEach((item) => revealObserver.observe(item));
  };

  const updateScrollState = () => {
    raf = 0;
    const y = window.scrollY;
    doc.querySelectorAll('[data-motion-header]').forEach((header) => header.classList.toggle('is-scrolled', y > 24));
    if (reduced.matches || window.innerWidth < 1024) return;
    doc.querySelectorAll('[data-parallax]').forEach((element) => {
      const rect = element.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      const amount = Number(element.dataset.parallax || 0.025);
      const centerDelta = rect.top + rect.height / 2 - window.innerHeight / 2;
      element.style.transform = `translate3d(0, ${centerDelta * -amount}px, 0)`;
    });
  };

  const onScroll = () => {
    if (raf) return;
    raf = window.requestAnimationFrame(updateScrollState);
  };

  const refresh = () => {
    applyStagger();
    initReveals();
    updateScrollState();
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  reduced.addEventListener?.('change', refresh);
  doc.addEventListener('astro:page-load', refresh);
  doc.addEventListener('DOMContentLoaded', refresh, { once: true });
  window.DecoMotion = { refresh };
})();
