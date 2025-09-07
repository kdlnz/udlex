// Fetch and inject a shared header from /includes/header.html
(async function(){
  try {
    const res = await fetch('/includes/header.html');
    if (!res.ok) return;
    const text = await res.text();
    const wrapper = document.createElement('div');
    wrapper.innerHTML = text;

    // find header element in fetched content
    const newHeader = wrapper.querySelector('.site-header') || wrapper.querySelector('header');
    if (!newHeader) return;

    // Mark hidden initially to avoid flash
    newHeader.classList.add('hidden');

    const existing = document.querySelector('.site-header');
    if (existing) {
      existing.replaceWith(newHeader);
    } else {
      document.body.insertBefore(newHeader, document.body.firstChild);
    }

    // Allow the browser to render then show the header (trigger transition)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        newHeader.classList.remove('hidden');
        newHeader.classList.add('visible');
      });
    });

    // Move any inline or external scripts from the fetched content into the document so they execute
    const scripts = wrapper.querySelectorAll('script');
    for (const s of scripts) {
      const scr = document.createElement('script');
      if (s.src) {
        scr.src = s.src;
        // keep defer behavior
        scr.defer = true;
      } else {
        scr.textContent = s.textContent;
      }
      document.body.appendChild(scr);
    }

    // dispatch event so other scripts can react
    window.dispatchEvent(new CustomEvent('header-injected', { detail: { header: newHeader } }));
  } catch (e) {
    console.error('Header load failed', e);
  }
})();
