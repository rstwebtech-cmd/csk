document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('siteNav');

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  // On mobile, tapping "Services" toggles its submenu instead of navigating away first
  var dropdown = document.querySelector('.nav__dropdown');
  if (dropdown && window.matchMedia('(max-width: 720px)').matches) {
    var link = dropdown.querySelector('a');
    link.addEventListener('click', function (e) {
      if (!dropdown.classList.contains('open')) {
        e.preventDefault();
        dropdown.classList.add('open');
      }
    });
  }
});
