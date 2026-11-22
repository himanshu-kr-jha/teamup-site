/* Picks light or dark before the first paint, so the page never flashes the
   wrong theme: a choice made with the toggle wins, then the system setting.
   Loaded without defer on purpose; it is a few lines. */
(function () {
  var theme = null;
  try { theme = localStorage.getItem('teamup-theme'); } catch (e) { /* private mode */ }
  if (theme !== 'light' && theme !== 'dark') {
    theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.classList.add('js');
})();
