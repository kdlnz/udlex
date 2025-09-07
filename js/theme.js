// Theme Management
let themeToggle = null;
const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  try {
    // Only persist theme if user accepted cookies
    if (getCookie('cookieConsent') === 'accepted') {
      localStorage.setItem('theme', theme);
    } else {
      localStorage.removeItem('theme');
    }
  } catch (e) { /* ignore storage errors */ }
  updateButtonText();
}

function updateButtonText() {
  themeToggle = document.getElementById('theme-toggle');
  if (!themeToggle) return;
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  themeToggle.textContent = currentTheme === 'dark' ? 'Light Mode' : 'Dark Mode';
}

function deleteAllCookies() {
  // delete all accessible cookies for path=/
  document.cookie.split(';').forEach(function(c) {
    const name = c.split('=')[0].trim();
    document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
  });
}

function setCookie(name, value, days) {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = name + '=' + value + ';expires=' + date.toUTCString() + ';path=/';
}

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

function loadTheme() {
  // Use saved preference only if user accepted cookies, otherwise default to dark
  try {
    const savedTheme = (getCookie('cookieConsent') === 'accepted') ? localStorage.getItem('theme') : null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      setTheme('dark');
    }
  } catch (e) {
    setTheme('dark');
  }
}

// Elements for cookie consent — ensure the element exists on every page
let cookieConsent = document.getElementById('cookie-consent');

function createCookieConsentElement() {
  const wrapper = document.createElement('div');
  wrapper.id = 'cookie-consent';
  wrapper.className = 'cookie-consent';
  wrapper.innerHTML = `
    <p>We use cookies to remember your preferences.</p>
    <div class="cookie-buttons">
      <button id="accept-cookies" class="button cookie-button">Accept</button>
      <button id="decline-cookies" class="button cookie-button cookie-decline">Decline</button>
    </div>`;
  document.body.appendChild(wrapper);
  return wrapper;
}

if (!cookieConsent) {
  cookieConsent = createCookieConsentElement();
}

let acceptCookies = document.getElementById('accept-cookies');
let declineCookies = document.getElementById('decline-cookies');

// Theme toggle handler: delegated to document so it works for injected header
document.addEventListener('click', (e) => {
  const target = e.target.closest && e.target.closest('#theme-toggle');
  if (!target) return;
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  setTheme(currentTheme === 'dark' ? 'light' : 'dark');
});

// Rebind when header is injected (header-loader dispatches this event)
window.addEventListener('header-injected', () => {
  updateButtonText();
});

// Cookie handlers (wired whether the markup existed or was injected)
if (acceptCookies) {
  acceptCookies.addEventListener('click', () => {
    setCookie('cookieConsent', 'accepted', 365);
    if (cookieConsent) cookieConsent.classList.remove('show');
    // Persist current theme now that consent granted
    try { localStorage.setItem('theme', document.documentElement.getAttribute('data-theme') || 'light'); } catch (e) {}
  });
}

if (declineCookies) {
  declineCookies.addEventListener('click', () => {
    // Per request: delete any cookies and nothing else
    deleteAllCookies();
    if (cookieConsent) cookieConsent.classList.remove('show');
  });
}

function checkCookieConsent() {
  if (!cookieConsent) return;
  if (!getCookie('cookieConsent')) {
    cookieConsent.classList.add('show');
  }
}

// Ensure footer is present on every page by loading footer JSON and injecting markup
async function ensureFooter() {
  try {
    if (document.querySelector('.site-footer')) return;
    const res = await fetch('/footer/footer.json');
    if (!res.ok) return;
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
  } catch (e) {
    // fail silently
    console.error('Footer load failed', e);
  }
}

ensureFooter();

// Initialize
loadTheme();
document.documentElement.classList.add('theme-loaded');
updateButtonText();
checkCookieConsent();

// Respect system changes only when user hasn't set a preference
prefersDarkScheme.addEventListener('change', (e) => {
  if (!localStorage.getItem('theme')) {
    setTheme(e.matches ? 'dark' : 'light');
  }
});
