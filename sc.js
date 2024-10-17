const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = 'https://lighthearted-speculoos-01ce2f.netlify.app/style.css';

link.onload = () => {
  console.log('Stylesheet loaded successfully');
};

link.onerror = () => {
  console.error(`Failed to load stylesheet: ${link.href}`);
};
document.querySelector('.glow-text').textContent = `Коллекционная карточка за тех. работы. Простите)`;
document.head.appendChild(link);
