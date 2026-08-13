'use strict';

(() => {
  const page = document.querySelector('.photo-page');
  if (!page) return;

  const buttons = [...page.querySelectorAll('[data-photo-year]')];
  const groups = [...page.querySelectorAll('[data-photo-year-group]')];
  const availableYears = new Set(buttons.map(button => button.dataset.photoYear).filter(Boolean));
  const defaultYear = buttons[0]?.dataset.photoYear || '';

  if (!buttons.length || !groups.length) return;

  function yearFromUrl() {
    const year = new URL(window.location.href).searchParams.get('year') || '';
    return availableYears.has(year) ? year : defaultYear;
  }

  function setUrlYear(year) {
    const url = new URL(window.location.href);
    if (year) url.searchParams.set('year', year);
    else url.searchParams.delete('year');
    window.history.pushState({ photoYear: year }, '', url);
  }

  function applyYear(year, updateUrl = false) {
    const activeYear = availableYears.has(year) ? year : defaultYear;
    groups.forEach(group => {
      const visible = group.dataset.photoYearGroup === activeYear;
      group.hidden = !visible;
    });

    buttons.forEach(button => {
      const active = button.dataset.photoYear === activeYear;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
      button.tabIndex = active ? 0 : -1;
    });

    page.dataset.activeYear = activeYear;
    if (updateUrl) setUrlYear(activeYear);
  }

  buttons.forEach((button, index) => {
    button.addEventListener('click', () => applyYear(button.dataset.photoYear, true));
    button.addEventListener('keydown', event => {
      let targetIndex = null;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') targetIndex = (index + 1) % buttons.length;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') targetIndex = (index - 1 + buttons.length) % buttons.length;
      if (event.key === 'Home') targetIndex = 0;
      if (event.key === 'End') targetIndex = buttons.length - 1;
      if (targetIndex === null) return;
      event.preventDefault();
      buttons[targetIndex].focus();
      buttons[targetIndex].click();
    });
  });

  window.addEventListener('popstate', () => applyYear(yearFromUrl()));
  applyYear(yearFromUrl());
})();
