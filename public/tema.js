(function () {
  var tema = null;
  try {
    tema = localStorage.getItem('cgd:tema');
  } catch (erro) {}
  if (tema !== 'claro' && tema !== 'escuro') {
    tema = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro';
  }
  document.documentElement.dataset.tema = tema;
  if (tema === 'escuro') {
    document.querySelector('meta[name="theme-color"]').setAttribute('content', '#0a0a0c');
  }
})();
