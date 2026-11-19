// Two separate installable apps: customer store (/) and admin panel (/admin).
// Pick the right manifest before the browser reads it. (External file so the CSP can forbid inline scripts.)
(function () {
  var isAdmin = location.pathname === "/admin" || location.pathname.indexOf("/admin/") === 0;
  if (!isAdmin) return;
  document.getElementById("app-manifest").setAttribute("href", "/manifest-admin.json");
  document.getElementById("app-theme").setAttribute("content", "#0a0a0a");
  document.getElementById("app-apple-title").setAttribute("content", "QADAM Admin");
  document.getElementById("app-apple-icon").setAttribute("href", "/icons/admin-192.png");
  document.title = "QADAM Admin";
})();

// Preload the hero (LCP) image of the home page before the JS bundle loads.
// HeroSection saves the exact src/srcset/sizes it renders, so the browser reuses this download.
(function () {
  if (location.pathname !== "/") return;
  try {
    var p = JSON.parse(localStorage.getItem("qadam_hero_preload") || "null");
    if (!p || !p.href) return;
    var l = document.createElement("link");
    l.rel = "preload";
    l.as = "image";
    l.href = p.href;
    if (p.srcset) { l.setAttribute("imagesrcset", p.srcset); l.setAttribute("imagesizes", p.sizes || ""); }
    l.setAttribute("fetchpriority", "high");
    document.head.appendChild(l);
  } catch (e) { /* storage blocked */ }
})();
