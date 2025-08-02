(async function() {
  const res = await fetch('/partners/partners.json');
  if (!res.ok) throw new Error('Could not load partners JSON');
  const partners = await res.json();

  const grid = document.querySelector('.partner-grid');

  partners.forEach(p => {
    // create container
    const item = document.createElement('div');
    item.className = 'partner-item';

    // image container for progressive loading
    const imgContainer = document.createElement('div');
    imgContainer.className = 'progressive-img-container';

    const img = document.createElement('img');
    img.src = p.image;
    img.alt = p.alt;
    img.className = 'partner-image';
    img.loading = "lazy"; // Enable native lazy loading
    
    // Add fade-in effect when image loads
    img.style.opacity = "0";
    img.onload = function() {
      img.style.opacity = "1";
    };

    imgContainer.appendChild(img);
    item.appendChild(imgContainer);

    // name
    const h3 = document.createElement('h3');
    h3.className = 'partner-name';
    h3.textContent = p.name;
    item.appendChild(h3);

    // description
    const desc = document.createElement('p');
    desc.className = 'partner-desc';
    desc.textContent = p.desc;
    item.appendChild(desc);

    // buttons container
    const btnCont = document.createElement('div');
    btnCont.className = 'button-container';
    p.links.forEach(link => {
      const a = document.createElement('a');
      a.className = 'button';
      a.href = link.url;
      a.target = '_blank';
      a.textContent = link.text;
      btnCont.appendChild(a);
    });
    item.appendChild(btnCont);

    grid.appendChild(item);
  });
})();