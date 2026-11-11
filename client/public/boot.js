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
