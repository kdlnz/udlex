(async function() {
  try {
    const res = await fetch('/faq/faq.json');
    if (!res.ok) throw new Error('Failed to load FAQ JSON');
    const faqs = await res.json();

    const list = document.getElementById('faq-list');
    if (!list) return;

    faqs.forEach((item, i) => {
      const details = document.createElement('details');
      details.className = 'faq-item';

      const summary = document.createElement('summary');
      summary.innerHTML = item.question;
      details.appendChild(summary);

      const div = document.createElement('div');
      div.className = 'faq-answer';
      div.innerHTML = item.answer;
      details.appendChild(div);

      list.appendChild(details);
    });
  } catch (e) {
    console.error(e);
  }
})();
