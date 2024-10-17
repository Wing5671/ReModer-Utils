  function loadStylesheet(href) {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Failed to load stylesheet: ${href}`));
      document.head.appendChild(link);
    });
  }

  loadStylesheet('https://6710fa175655dd0ef8a4e581--lighthearted-speculoos-01ce2f.netlify.app/style.css')
    .then(() => {
      console.log('Stylesheet loaded successfully');
    })
    .catch(error => {
      console.error(error);
    });
