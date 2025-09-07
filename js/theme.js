// Helper functions for cookies
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

function deleteAllCookies() {
  document.cookie.split(';').forEach(function(c) {
    const name = c.split('=')[0].trim();
    document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
  });
}

// Theme Management
const themeToggle = document.getElementById('theme-toggle');
const cookieConsent = document.getElementById('cookie-consent');
const acceptCookies = document.getElementById('accept-cookies');
const declineCookies = document.getElementById('decline-cookies');

function applyTheme(theme) {
  if (theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  if (themeToggle) {
    themeToggle.textContent = theme === 'light' ? 'Dark Mode' : 'Light Mode';
  }
}

function saveThemePreference(theme) {
  try {
    if (getCookie('cookieConsent') === 'accepted') {
      localStorage.setItem('theme', theme);
    } else {
      localStorage.removeItem('theme');
    }
  } catch (e) {
    console.error('Failed to save theme preference:', e);
  }
}

// Event Listeners
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.hasAttribute('data-theme') ? 'light' : 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    saveThemePreference(newTheme);
  });
}

if (acceptCookies && cookieConsent) {
  acceptCookies.addEventListener('click', () => {
    setCookie('cookieConsent', 'accepted', 365);
    cookieConsent.classList.remove('show');
    const currentTheme = document.documentElement.hasAttribute('data-theme') ? 'light' : 'dark';
    saveThemePreference(currentTheme);
  });
}

if (declineCookies && cookieConsent) {
  declineCookies.addEventListener('click', () => {
    deleteAllCookies();
    localStorage.removeItem('theme');
    cookieConsent.classList.remove('show');
  });
}

// Initialization
function init() {
  // Apply saved theme if consent is given
  let savedTheme = 'dark'; // Default to dark
  try {
    if (getCookie('cookieConsent') === 'accepted') {
      savedTheme = localStorage.getItem('theme') || 'dark';
    }
  } catch (e) {
    console.error('Failed to load theme preference:', e);
  }
  applyTheme(savedTheme);

  // Show cookie consent if not set
  if (cookieConsent && !getCookie('cookieConsent')) {
    cookieConsent.classList.add('show');
  }

  // Add class to show that JS is loaded and theme is handled
  document.documentElement.classList.add('theme-loaded');
}

init();
