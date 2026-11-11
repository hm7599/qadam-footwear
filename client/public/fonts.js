// Turn the non-blocking font stylesheet on as soon as it has loaded
(function () {
  var l = document.getElementById('gfonts');
  if (!l) return;
  var on = function () { l.media = 'all'; };
  if (l.sheet) on(); else l.addEventListener('load', on);
})();
