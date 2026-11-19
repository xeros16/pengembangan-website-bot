(() => {
  const search = document.getElementById('command-search');
  const category = document.getElementById('command-category');
  const count = document.getElementById('command-result-count');
  if (!search || !category || !count) return;

  const cards = [...document.querySelectorAll('[data-command-card]')];
  const workflows = [...document.querySelectorAll('[data-workflow-card]')];
  const workflowSection = document.querySelector('.command-explorer-workflows');
  const noResults = document.getElementById('command-no-results');
  const copyButtons = [...document.querySelectorAll('[data-copy-command]')];

  for (const button of copyButtons) {
    button.addEventListener('click', async () => {
      const value = button.dataset.copyCommand || '';
      try {
        await navigator.clipboard.writeText(value);
        button.textContent = 'Tersalin';
      } catch {
        const code = button.parentElement?.querySelector('code');
        if (code) {
          const range = document.createRange();
          range.selectNodeContents(code);
          const selection = window.getSelection();
          if (selection) {
            selection.removeAllRanges();
            selection.addRange(range);
          }
        }
        button.textContent = 'Teks dipilih · Ctrl+C';
      }
      window.setTimeout(() => { button.textContent = button.dataset.copyLabel || 'Salin contoh'; }, 1800);
    });
  }

  const update = () => {
    const query = (search.value || '').trim().toLocaleLowerCase('id-ID');
    const selectedCategory = category.value;
    let visibleCommands = 0;
    let visibleWorkflows = 0;

    for (const card of cards) {
      const matches = (!query || (card.dataset.search || '').includes(query))
        && (!selectedCategory || card.dataset.category === selectedCategory);
      card.hidden = !matches;
      if (matches) visibleCommands += 1;
    }

    for (const card of workflows) {
      const matches = !query || (card.dataset.search || '').includes(query);
      card.hidden = !matches;
      if (matches) visibleWorkflows += 1;
    }

    if (workflowSection) workflowSection.hidden = workflows.length > 0 && visibleWorkflows === 0;
    if (noResults) noResults.hidden = visibleCommands > 0 || visibleWorkflows > 0;
    count.textContent = `${visibleCommands} dari ${cards.length} perintah · ${visibleWorkflows} dari ${workflows.length} workflow ditampilkan.`;
  };

  search.addEventListener('input', update);
  category.addEventListener('change', update);
  update();
})();
