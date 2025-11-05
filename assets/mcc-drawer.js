(() => {
  const details = document.getElementById('Details-menu-drawer-container');
  if (!details || details.tagName.toLowerCase() !== 'details') return;

  let lock = false;

  // When the drawer is opened by the <summary>, Dawn adds body.menu-opening briefly.
  details.addEventListener('toggle', () => {
    // If it just opened, nothing to do (CSS handles open nicely)
    if (details.open) return;

    // It is closing: hold the element open, animate out, then really close.
    if (lock) return;
    lock = true;

    // Set the [closing] attribute so CSS close transition applies.
    details.setAttribute('closing', '');

    // Duration must match --drawer-close-dur in CSS (300ms). Give it a tiny buffer.
    const CLOSE_MS = 300;
    setTimeout(() => {
      details.removeAttribute('closing');
      // Now actually close it (removes [open]).
      details.open = false;
      lock = false;
    }, CLOSE_MS + 40);
  });

  // Optional: allow tapping the scrim to close (the scrim doesn't receive pointer events,
  // so we delegate to clicking the <summary> if the user taps outside the panel).
  document.addEventListener('click', (e) => {
    if (!details.open || lock) return;

    const panel = document.getElementById('menu-drawer');
    if (!panel) return;

    const clickInsidePanel = panel.contains(e.target);
    const clickOnSummary = e.target.closest('summary.header__icon--menu');

    // Clicks outside the panel that are not the burger icon should close.
    if (!clickInsidePanel && !clickOnSummary) {
      // Trigger the <summary> to toggle, which will move us into the 'closing' path above.
      const summary = details.querySelector('summary.header__icon--menu');
      if (summary) summary.click();
    }
  });
})();
