/* Natal em Família: a Christmas home screen. Talks to the box through window.TV (MainActivity.Bridge). */
"use strict";

var W = 1920, H = 1080;
var bridge = window.TV || mockBridge();
var $ = function (s) { return document.querySelector(s); };

function rng(seed) {
  return function () { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
}

// MARK: - The scene (painted once): warm bokeh lights, snowy pines, snow on the ground

function pine(c, x, base, h, r) {
  var w = h * 0.36;
  for (var i = 0; i < 5; i++) {
    var y = base - i * h * 0.17, tw = w * (1 - i * 0.17), th = h * 0.3;
    c.fillStyle = i % 2 ? "#123222" : "#0e2a1c";
    c.beginPath(); c.moveTo(x - tw, y); c.lineTo(x, y - th); c.lineTo(x + tw, y); c.closePath(); c.fill();
    c.fillStyle = "rgba(240,246,255,0.92)";   // snow on each tier's edge
    c.beginPath(); c.moveTo(x - tw, y); c.quadraticCurveTo(x - tw * 0.4, y - th * 0.18, x, y - th * 0.1);
    c.quadraticCurveTo(x + tw * 0.4, y - th * 0.18, x + tw, y); c.lineTo(x + tw * 0.8, y + 6); c.lineTo(x - tw * 0.8, y + 6); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(x - tw * 0.25, y - th * 0.72); c.lineTo(x, y - th); c.lineTo(x + tw * 0.25, y - th * 0.72); c.closePath(); c.fill();
  }
  c.fillStyle = "#2b170c";
  c.fillRect(x - h * 0.03, base, h * 0.06, h * 0.08);
}

/** The scene at the box's own resolution (1280 x 720), kept once painted: a slow box paints it only the first time. */
var SCENE_KEY = "scene-v1";
function paintScene() {
  var cv = $("#scene"), c = cv.getContext("2d");
  var saved = null;
  try { saved = localStorage.getItem(SCENE_KEY); } catch (e) {}
  if (saved) {
    var im = new Image();
    im.onload = function () { c.drawImage(im, 0, 0); };
    im.src = saved;
    return;
  }
  c.save();
  c.scale(cv.width / W, cv.height / H);
  drawScene(c);
  c.restore();
  try { localStorage.setItem(SCENE_KEY, cv.toDataURL("image/jpeg", 0.9)); } catch (e) {}
}

function drawScene(c) {
  var r = rng(1224);
  var g = c.createRadialGradient(W * 0.5, H * 0.35, 80, W * 0.5, H * 0.45, W * 0.75);
  g.addColorStop(0, "#6b2a17");
  g.addColorStop(0.45, "#3d130c");
  g.addColorStop(1, "#140504");
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);

  // A soft window glow, behind everything.
  var glow = c.createRadialGradient(W * 0.55, H * 0.42, 20, W * 0.55, H * 0.42, 700);
  glow.addColorStop(0, "rgba(255,190,110,0.35)");
  glow.addColorStop(1, "rgba(255,190,110,0)");
  c.fillStyle = glow;
  c.fillRect(0, 0, W, H);

  // Bokeh: out-of-focus Christmas lights.
  var colors = ["255,207,107", "255,241,201", "255,70,60", "255,170,80", "255,226,150", "120,200,140"];
  c.save();
  for (var i = 0; i < 90; i++) {
    var x = r() * W, y = r() * H * 0.82, rad = 14 + r() * 52, col = colors[Math.floor(r() * colors.length)];
    if (col === "120,200,140" && r() < 0.6) col = colors[0];
    c.filter = "blur(" + Math.round(4 + r() * 10) + "px)";
    var bg = c.createRadialGradient(x, y, 0, x, y, rad);
    var a = 0.25 + r() * 0.5;
    bg.addColorStop(0, "rgba(" + col + "," + a.toFixed(2) + ")");
    bg.addColorStop(0.7, "rgba(" + col + "," + (a * 0.75).toFixed(2) + ")");
    bg.addColorStop(1, "rgba(" + col + ",0)");
    c.fillStyle = bg;
    c.beginPath(); c.arc(x, y, rad, 0, Math.PI * 2); c.fill();
  }
  c.restore();

  // Snowy pines on both sides, blurred a little (depth), then a sharper pair in front.
  c.save();
  c.filter = "blur(3px)";
  pine(c, 70, 990, 560, r); pine(c, 250, 1010, 420, r);
  pine(c, 1860, 990, 600, r); pine(c, 1690, 1015, 430, r);
  c.restore();
  pine(c, -20, 1060, 700, r);
  pine(c, 1950, 1060, 720, r);

  // Snow on the ground.
  var sg = c.createLinearGradient(0, 960, 0, H);
  sg.addColorStop(0, "#f4f7ff");
  sg.addColorStop(1, "#cfd8ea");
  c.fillStyle = sg;
  c.beginPath();
  c.moveTo(0, 1000);
  for (var sx = 0; sx <= W; sx += 120) c.quadraticCurveTo(sx + 60, 960 + r() * 40, sx + 120, 990 + r() * 30);
  c.lineTo(W, H); c.lineTo(0, H); c.closePath(); c.fill();
  c.fillStyle = "rgba(255,255,255,0.6)";
  for (var k = 0; k < 120; k++) c.fillRect(r() * W, 985 + r() * 90, 2, 2);

  // Vignette.
  var v = c.createRadialGradient(W / 2, H / 2, H * 0.5, W / 2, H / 2, H * 1.05);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, "rgba(10,0,0,0.6)");
  c.fillStyle = v;
  c.fillRect(0, 0, W, H);
}

// MARK: - Falling snow (a half-size canvas, scaled up: soft flakes, light on a small box)

var flakes = [], snowOn = true, lastFrame = 0;

function startSnow() {
  var r = rng(7);
  for (var i = 0; i < 110; i++) {
    flakes.push({ x: r() * 960, y: r() * 540, s: 0.6 + r() * 1.8, v: 0.25 + r() * 0.75, p: r() * 6.28, w: 0.3 + r() * 0.7 });
  }
  requestAnimationFrame(snowFrame);
}

function snowFrame(t) {
  requestAnimationFrame(snowFrame);
  if (!snowOn || t - lastFrame < 33) return;   // about 30 frames a second is plenty
  var dt = lastFrame ? Math.min(3, (t - lastFrame) / 33) : 1;
  lastFrame = t;
  var c = $("#snow").getContext("2d");
  c.clearRect(0, 0, 960, 540);
  c.fillStyle = "rgba(255,255,255,0.85)";
  c.beginPath();
  for (var i = 0; i < flakes.length; i++) {
    var f = flakes[i];
    f.p += 0.02 * dt;
    f.y += f.v * dt;
    f.x += Math.sin(f.p) * f.w * 0.5 * dt;
    if (f.y > 545) { f.y = -5; f.x = Math.random() * 960; }
    if (f.x < -5) f.x = 965; else if (f.x > 965) f.x = -5;
    c.moveTo(f.x + f.s, f.y);
    c.arc(f.x, f.y, f.s, 0, Math.PI * 2);
  }
  c.fill();
}

// MARK: - The garland around the photo frame

function paintGarland() {
  var cv = $("#photoBox .garland"), c = cv.getContext("2d"), r = rng(31);
  var w = cv.width, h = cv.height;
  function needles(x, y, len, angle) {   // one pine sprig: a stem with needles
    c.save(); c.translate(x, y); c.rotate(angle);
    c.strokeStyle = "#3e2a12"; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 0); c.lineTo(len, 0); c.stroke();
    for (var i = 4; i < len; i += 5) {
      var shade = ["#1f5a2c", "#2a7038", "#174a24", "#33803f"][Math.floor(r() * 4)];
      c.strokeStyle = shade; c.lineWidth = 2.4;
      var n = 10 + r() * 8;
      c.beginPath(); c.moveTo(i, 0); c.lineTo(i + n * 0.6, -n); c.moveTo(i, 0); c.lineTo(i + n * 0.6, n); c.stroke();
    }
    c.restore();
  }
  function cluster(cx, cy, size, spread) {
    for (var k = 0; k < 26; k++) needles(cx + (r() - 0.5) * spread, cy + (r() - 0.5) * spread * 0.6, size * (0.5 + r() * 0.6), r() * Math.PI * 2);
  }
  // Heavy corners top-left and top-right, lighter at the bottom, and a light swag along the top.
  cluster(60, 50, 90, 120); cluster(150, 30, 70, 80); cluster(40, 150, 70, 70);
  cluster(w - 60, 50, 90, 120); cluster(w - 150, 30, 70, 80); cluster(w - 40, 150, 70, 70);
  cluster(60, h - 50, 70, 90); cluster(w - 60, h - 50, 70, 90);
  for (var x = 220; x < w - 220; x += 60) needles(x, 18 + Math.sin(x / 90) * 6, 50, (r() - 0.5) * 0.6);
  // Ornaments.
  var balls = [[95, 95, "#c8141e"], [w - 95, 95, "#d4a017"], [150, 75, "#d4a017"], [w - 150, 75, "#c8141e"], [70, h - 70, "#c8141e"], [w - 70, h - 70, "#d4a017"]];
  balls.forEach(function (b) {
    var gr = c.createRadialGradient(b[0] - 7, b[1] - 7, 2, b[0], b[1], 20);
    gr.addColorStop(0, "#fff"); gr.addColorStop(0.25, b[2]); gr.addColorStop(1, "#3a0a06");
    c.fillStyle = gr; c.beginPath(); c.arc(b[0], b[1], 19, 0, Math.PI * 2); c.fill();
  });
  // Fairy lights: twinkling dots (CSS), spread over the greenery.
  var lights = $("#photoBox .lights"), spots = [];
  for (var i = 0; i < 9; i++) spots.push([20 + r() * 200, 15 + r() * 150], [w - 20 - r() * 200, 15 + r() * 150]);
  for (var j = 0; j < 9; j++) spots.push([250 + j * 60, 18 + Math.sin(j) * 8]);
  for (var q = 0; q < 4; q++) spots.push([20 + r() * 110, h - 15 - r() * 90], [w - 20 - r() * 110, h - 15 - r() * 90]);
  var warm = ["#ffe9a8", "#ffd36b", "#fff6dc", "#ffb347"];
  spots.forEach(function (p, n) {
    var s = document.createElement("span"), col = warm[n % warm.length];
    s.style.left = p[0] + "px"; s.style.top = p[1] + "px";
    s.style.background = col; s.style.boxShadow = "0 0 10px 4px " + col;
    s.style.animationDelay = (r() * 2.4).toFixed(2) + "s";
    lights.appendChild(s);
  });
}

// MARK: - Clock and weather

var MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
function tick() {
  var d = new Date();
  $("#time").textContent = String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  $("#date").textContent = d.getDate() + " de " + MONTHS[d.getMonth()];
  setTimeout(tick, 60000 - (d.getSeconds() * 1000 + d.getMilliseconds()) + 50);
}

function condition(code) {
  if (code <= 0) return "Céu limpo";
  if (code <= 2) return "Poucas nuvens";
  if (code === 3) return "Nublado";
  if (code === 45 || code === 48) return "Neblina";
  if (code >= 51 && code <= 57) return "Garoa";
  if (code >= 61 && code <= 67) return "Chuva";
  if (code >= 80 && code <= 82) return "Pancadas de chuva";
  if (code >= 71 && code <= 77) return "Neve";
  if (code >= 95) return "Trovoadas";
  return "Chuva";
}
function weatherIcon(code, day) {
  if (code <= 1) return day ? "sunny" : "clear_night";
  if (code === 2) return day ? "partly_cloudy_day" : "partly_cloudy_night";
  if (code === 3) return "cloud";
  if (code === 45 || code === 48) return "foggy";
  if (code >= 71 && code <= 77) return "snowflake";
  if (code >= 95) return "thunderstorm";
  return "rainy";
}
window.onWeather = function (body) {
  if (!body) { $("#wcond").textContent = "Sem conexão"; setTimeout(function () { bridge.weather(); }, 120000); return; }
  try {
    var o = JSON.parse(body), cur = o.current;
    $("#wtemp").textContent = Math.round(cur.temperature_2m) + "°C";
    $("#wcond").textContent = condition(cur.weather_code);
    $("#wicon").src = "symbols/" + weatherIcon(cur.weather_code, cur.is_day === 1) + ".png";
  } catch (e) {}
};

// MARK: - Photos: the frame's slideshow, and the full-screen view

var photos = [], shown = 0, slideTimer = null, front = "a";
function photoUrl(name) { return bridge.photoUrl ? bridge.photoUrl(name) : "https://tv.local/photo/" + encodeURIComponent(name); }

/** The photo, blurred and stretched, behind itself (fills the frame around a portrait photo). */
function paintBlur(canvas, img) {
  var c = canvas.getContext("2d");
  c.filter = "blur(6px) brightness(0.75)";
  var cw = canvas.width, ch = canvas.height, s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
  c.drawImage(img, (cw - img.naturalWidth * s) / 2 - 8, (ch - img.naturalHeight * s) / 2 - 8, img.naturalWidth * s + 16, img.naturalHeight * s + 16);
}

function showPhoto(i) {
  if (!photos.length) return;
  shown = (i + photos.length) % photos.length;
  var next = front === "a" ? "b" : "a";
  var img = $("#photoBox .ph." + next), old = $("#photoBox .ph." + front);
  img.onload = function () {
    paintBlur($("#photoBox .blur"), img);
    img.classList.add("on");
    old.classList.remove("on");
    front = next;
  };
  img.src = photoUrl(photos[shown]);
}

function startSlides() {
  clearInterval(slideTimer);
  slideTimer = setInterval(function () { if (!viewerOpen) showPhoto(shown + 1); }, 8000);
}

function loadPhotos() {
  try { photos = JSON.parse(bridge.photos()); } catch (e) { photos = []; }
  $("#photoBox .empty").style.display = photos.length ? "none" : "block";
  if (photos.length) { showPhoto(Math.floor(Math.random() * photos.length)); startSlides(); }
}

var viewerOpen = false;
function viewerShow(i) {
  shown = (i + photos.length) % photos.length;
  var big = $("#viewer .big");
  big.style.opacity = 0;
  big.onload = function () { paintBlur($("#viewer .blur"), big); big.style.opacity = 1; };
  big.src = photoUrl(photos[shown]);
  $("#viewer .count").textContent = (shown + 1) + " / " + photos.length;
}

/** Grows out of the frame: starts at the frame's size and position, then fills the screen. */
function openViewer() {
  if (!photos.length) return;
  var v = $("#viewer"), r = $("#photoBox .pic").getBoundingClientRect(), k = W / window.innerWidth;
  viewerShow(shown);
  v.style.transition = "none";
  v.style.transform = "translate(" + r.left * k + "px," + r.top * k + "px) scale(" + (r.width * k / W) + "," + (r.height * k / H) + ")";
  v.classList.add("open");
  void v.offsetWidth;
  v.style.transition = "";
  v.style.transform = "translate(0,0) scale(1,1)";
  viewerOpen = true;
}
function closeViewer() {
  var v = $("#viewer"), r = $("#photoBox .pic").getBoundingClientRect(), k = W / window.innerWidth;
  v.style.transform = "translate(" + r.left * k + "px," + r.top * k + "px) scale(" + (r.width * k / W) + "," + (r.height * k / H) + ")";
  v.classList.remove("open");
  viewerOpen = false;
  showPhoto(shown);
}

// MARK: - Apps

var MAIN = ["photo", "app1", "app2", "all"];
var NAV = {   // where each arrow goes from each item on the main screen
  photo: { right: "app1" },
  app1: { left: "photo", down: "app2" },
  app2: { left: "photo", up: "app1", down: "all" },
  all: { left: "photo", up: "app2" }
};

function setupTiles() {
  ["#app1", "#app2"].forEach(function (sel) {
    var t = $(sel), pkg = t.dataset.pkg, img = t.querySelector("img");
    img.onload = function () { t.classList.add("has-img"); };
    img.onerror = function () { img.style.display = "none"; };
    img.src = "https://tv.local/icon/" + encodeURIComponent(pkg);
  });
}

var appsOpen = false, appList = [], appIndex = 0;
function openApps() {
  try { appList = JSON.parse(bridge.apps()); } catch (e) { appList = []; }
  appList.sort(function (a, b) { return (a.system - b.system) || a.label.localeCompare(b.label, "pt"); });
  appList.push({ pkg: "settings", label: "Configurações", sym: true });
  var grid = $("#apps .grid");
  grid.innerHTML = "";
  appList.forEach(function (a) {
    var e = document.createElement("div"), art = document.createElement("div"), img = document.createElement("img"), n = document.createElement("div");
    e.className = "app"; art.className = "art"; n.className = "name"; n.textContent = a.label;
    if (a.sym) { img.src = "symbols/settings.png"; img.style.cssText = "object-fit:contain;padding:40px;background:#3a3f55"; }
    else img.src = "https://tv.local/icon/" + encodeURIComponent(a.pkg);
    art.appendChild(img); e.appendChild(art); e.appendChild(n); grid.appendChild(e);
  });
  $("#apps").classList.add("open");
  appsOpen = true;
  appFocus(0);
}
function closeApps() { $("#apps").classList.remove("open"); appsOpen = false; }
function appFocus(i) {
  var items = document.querySelectorAll("#apps .app");
  if (!items.length) return;
  appIndex = Math.max(0, Math.min(items.length - 1, i));
  for (var j = 0; j < items.length; j++) items[j].classList.toggle("focused", j === appIndex);
  var row = Math.floor(appIndex / 4);   // 4 per row; scroll so the row shows
  $("#apps .grid").style.transform = "translateY(" + (-Math.max(0, row - 2) * 249) + "px)";
}

// MARK: - Focus and the remote

var current = "app1";
function focus(name) {
  current = name;
  var items = document.querySelectorAll(".f");
  for (var i = 0; i < items.length; i++) items[i].classList.toggle("focused", items[i].dataset.nav === name);
}

function activate() {
  if (current === "photo") openViewer();
  else if (current === "all") openApps();
  else bridge.open($("[data-nav=" + current + "]").dataset.pkg);
}

document.addEventListener("keydown", function (e) {
  var k = e.key, dir = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" }[k];
  if (!dir && k !== "Enter") return;
  e.preventDefault();
  if (viewerOpen) {
    if (dir === "left") viewerShow(shown - 1);
    else if (dir === "right") viewerShow(shown + 1);
    else if (k === "Enter") closeViewer();
    return;
  }
  if (appsOpen) {
    if (dir) appFocus(appIndex + ({ left: -1, right: 1, up: -4, down: 4 })[dir]);
    else bridge.open(appList[appIndex].pkg);
    return;
  }
  if (dir) { var to = NAV[current][dir]; if (to) focus(to); }
  else activate();
});

window.onBack = function () {
  if (viewerOpen) closeViewer();
  else if (appsOpen) closeApps();
};
window.reset = function () {
  if (viewerOpen) closeViewer();
  if (appsOpen) closeApps();
  focus("app1");
};
window.onResume = function () { snowOn = true; loadPhotos(); bridge.weather(); };
window.onPause = function () { snowOn = false; };

// MARK: - Start

function mockBridge() {   // a browser on a computer: sample data
  return {
    apps: function () { return JSON.stringify([{ pkg: "com.world.youcinetv", label: "YouCine", system: false }, { pkg: "org.smarttube.stable", label: "SmartTube", system: false }, { pkg: "com.global.veloplaytv", label: "VeloPlay", system: false }]); },
    photos: function () { var a = []; for (var i = 1; i <= 14; i++) a.push("foto" + (i < 10 ? "0" : "") + i + ".jpg"); return JSON.stringify(a); },
    photoUrl: function (n) { return "../../../fotos/" + n; },
    open: function (p) { console.log("open " + p); },
    weather: function () { setTimeout(function () { onWeather(JSON.stringify({ current: { temperature_2m: 27.4, weather_code: 2, is_day: 1 } })); }, 100); }
  };
}

paintScene();
paintGarland();
startSnow();
tick();
setupTiles();
loadPhotos();
bridge.weather();
setInterval(function () { bridge.weather(); }, 30 * 60000);
focus("app1");
