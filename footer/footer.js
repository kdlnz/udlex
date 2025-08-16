(async function(){
  try {
    const res = await fetch('/footer/footer.json');
    if (!res.ok) throw new Error('Failed to load footer JSON');
    const items = await res.json();
    const footer = document.createElement('footer');
    footer.className = 'site-footer';
    const inner = document.createElement('div');
    inner.className = 'footer-inner container';
    const ul = document.createElement('ul');
    ul.className = 'footer-links';
    items.forEach(it => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = it.url;
      a.textContent = it.text;
      li.appendChild(a);
      ul.appendChild(li);
    });
    inner.appendChild(ul);
    footer.appendChild(inner);
    document.body.appendChild(footer);
  } catch (e) { console.error(e); }
})();
