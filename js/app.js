/* =========================================================
   LUMI GIFT – logika micro-site (versi boho + glass)
   Data setiap pesanan ada di /data/<id>.json
   Alamat halaman: /untuk/<id>   atau   /?u=<id>
   ========================================================= */

const CONFIG = {
  // Nomor WhatsApp LUMI GIFT (format 62...). Kosongkan untuk menyembunyikan tautan pemesanan.
  whatsapp: "",
  pesanWA: "Halo LUMI GIFT, saya mau pesan kado seperti ini.",
};

const $ = (s) => document.querySelector(s);
const body = document.body;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const buzz = (ms) => { if (!reduceMotion && navigator.vibrate) navigator.vibrate(ms); };

/* ---------- 1. Ambil id pesanan dari alamat ---------- */
function getId() {
  const q = new URLSearchParams(location.search).get("u");
  const path = location.pathname.match(/\/untuk\/([^/]+)/);
  const id = (q || (path && path[1]) || "").toLowerCase();
  return /^[a-z0-9-]+$/.test(id) ? id : null;
}

async function loadData(id) {
  const res = await fetch(`/data/${id}.json`, { cache: "no-cache" });
  if (!res.ok) throw new Error("not found");
  return res.json();
}

function showMissing() {
  body.classList.remove("is-intro", "is-loading");
  body.classList.add("is-open");
  $("#intro").hidden = true;
  $("#missing").hidden = false;
}

/* ---------- 2. Isi halaman ---------- */
// "ucapan" di JSON, misal "Selamat Wisuda". Bila kosong, diambil dari "judul".
function getGreeting(d) {
  if (d.ucapan) return d.ucapan;
  if (d.judul && d.penerima) {
    const esc = d.penerima.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const g = d.judul.replace(new RegExp(`[,\\s]*${esc}[.!\\s]*$`, "i"), "").trim();
    if (g) return g;
  }
  return "Ada kado untukmu";
}

function fill(d) {
  const greet = getGreeting(d);
  document.title = `Untuk ${d.penerima} – LUMI GIFT`;

  $("#introGreet").textContent = greet;
  $("#introName").textContent = d.penerima || "";
  $("#introFrom").textContent = d.pengirim ? `dari ${d.pengirim}` : "";

  $("#greet").textContent = greet;
  $("#name").textContent = d.penerima || "";
  $("#meta").textContent = d.keterangan || "";

  renderPhotos(d.foto || []);
  renderSong(d.lagu);
  renderLetter(d.surat, d.pengirim);

  if (d.pesanRahasia) $("#secretText").textContent = d.pesanRahasia;
  else $(".panel--secret").hidden = true;

  if (CONFIG.whatsapp) {
    const a = $("#orderLink");
    a.href = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(CONFIG.pesanWA)}`;
    a.hidden = false;
  }
}

/* ---------- Foto ---------- */
let photos = [];
function renderPhotos(list) {
  photos = list;
  const wrap = $("#prints");
  if (!list.length) { $(".panel--photos").hidden = true; return; }
  const n = list.length;
  wrap.className = "prints " + (n <= 4 ? `prints--${n}` : "prints--n");
  const dots = $("#dots");

  list.forEach((f, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "print" + (i === 0 ? " is-active" : "");
    if ((n === 3 || n === 4 || n > 4) && i === 0) b.classList.add("print--span");
    b.setAttribute("aria-label", `Lihat foto ${i + 1}${f.caption ? ": " + f.caption : ""}`);

    const frame = document.createElement("span");
    frame.className = "print__frame";
    const img = new Image();
    img.src = f.src;
    img.alt = f.caption || `Foto ${i + 1}`;
    img.loading = i < 2 ? "eager" : "lazy";
    img.decoding = "async";
    if (f.posisi) img.style.objectPosition = f.posisi; // contoh: "center top"
    frame.append(img);
    b.append(frame);

    if (f.caption) {
      const s = document.createElement("span");
      s.className = "print__cap";
      s.textContent = f.caption;
      b.append(s);
    }
    b.addEventListener("click", () => openViewer(i));
    wrap.append(b);

    if (n > 1) {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.tabIndex = -1;
      if (i === 0) dot.className = "is-active";
      dot.addEventListener("click", () => b.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" }));
      dots.append(dot);
    }
  });

  $("#photoCount").textContent = n > 1 ? `1 / ${n}` : "";

  // tandai foto yang sedang di tengah (carousel HP)
  const slides = [...wrap.children];
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.intersectionRatio < 0.6) return;
      const idx = slides.indexOf(e.target);
      slides.forEach((s, k) => s.classList.toggle("is-active", k === idx));
      [...dots.children].forEach((d, k) => d.classList.toggle("is-active", k === idx));
      $("#photoCount").textContent = `${idx + 1} / ${n}`;
    });
  }, { root: wrap, threshold: [0.6] });
  slides.forEach((s) => io.observe(s));
}

const viewer = $("#viewer");
let current = 0;
function openViewer(i) {
  current = (i + photos.length) % photos.length;
  const f = photos[current];
  $("#viewerImg").src = f.src;
  $("#viewerImg").alt = f.caption || `Foto ${current + 1}`;
  $("#viewerCap").textContent = f.caption || "";
  $("#viewerCount").textContent = `${current + 1} / ${photos.length}`;
  $(".viewer__nav").hidden = photos.length < 2;
  if (!viewer.open) viewer.showModal();
}
$("#prevBtn").addEventListener("click", () => openViewer(current - 1));
$("#nextBtn").addEventListener("click", () => openViewer(current + 1));
$("#closeBtn").addEventListener("click", () => viewer.close());
viewer.addEventListener("click", (e) => { if (e.target === viewer) viewer.close(); });
viewer.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") openViewer(current - 1);
  if (e.key === "ArrowRight") openViewer(current + 1);
});
let touchX = null;
viewer.addEventListener("touchstart", (e) => { touchX = e.touches[0].clientX; }, { passive: true });
viewer.addEventListener("touchend", (e) => {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 50) openViewer(current + (dx < 0 ? 1 : -1));
  touchX = null;
});

/* ---------- Lagu ---------- */
const audio = $("#audio");
const songPanel = $("#songPanel");
let songType = null;

function embedUrl(lagu) {
  const u = lagu.src || "";
  if (lagu.tipe === "spotify") {
    const m = u.match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?(track|album|playlist)\/([A-Za-z0-9]+)/);
    return m ? `https://open.spotify.com/embed/${m[1]}/${m[2]}?utm_source=generator` : null;
  }
  if (lagu.tipe === "youtube") {
    const m = u.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
    return m ? `https://www.youtube-nocookie.com/embed/${m[1]}` : null;
  }
  return null;
}

function renderSong(lagu) {
  if (!lagu || !lagu.src) { songPanel.hidden = true; return; }
  songType = lagu.tipe || "audio";
  $("#songTitle").textContent = lagu.judul || "Lagu kenangan";
  $("#songArtist").textContent = lagu.artis || "";
  $("#songNote").textContent = lagu.catatan || "";

  if (songType === "audio") { audio.src = lagu.src; return; }

  // Spotify / YouTube: pakai pemutar resmi
  const url = embedUrl(lagu);
  $("#player").hidden = true;
  const box = $("#embed");
  box.hidden = false;
  if (!url) { box.textContent = "Tautan lagu belum benar. Periksa kembali link Spotify/YouTube di data pesanan."; return; }
  const ifr = document.createElement("iframe");
  ifr.src = url;
  ifr.loading = "lazy";
  ifr.title = `Pemutar lagu ${lagu.judul || ""}`;
  ifr.allow = "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
  if (songType === "spotify") ifr.height = 152;
  box.className = "embed" + (songType === "youtube" ? " embed--yt" : "");
  box.append(ifr);
}

const fmt = (s) => (isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}` : "0:00");
const seek = $("#seek");
function setPlaying(on) {
  songPanel.classList.toggle("is-playing", on);
  $("#playBtn").setAttribute("aria-label", on ? "Jeda lagu" : "Putar lagu");
  $("#mini").classList.toggle("is-paused", !on);
  $("#miniLabel").textContent = on ? "Jeda lagu" : "Putar lagu";
}
audio.addEventListener("play", () => setPlaying(true));
audio.addEventListener("pause", () => setPlaying(false));
audio.addEventListener("ended", () => setPlaying(false));
audio.addEventListener("loadedmetadata", () => { $("#tDur").textContent = fmt(audio.duration); });
audio.addEventListener("timeupdate", () => {
  if (!audio.duration) return;
  const p = (audio.currentTime / audio.duration) * 100;
  seek.value = p;
  seek.style.setProperty("--p", p + "%");
  $("#tNow").textContent = fmt(audio.currentTime);
});
seek.addEventListener("input", () => {
  if (audio.duration) audio.currentTime = (seek.value / 100) * audio.duration;
  seek.style.setProperty("--p", seek.value + "%");
});
const toggleAudio = () => (audio.paused ? audio.play().catch(() => {}) : audio.pause());
$("#playBtn").addEventListener("click", toggleAudio);
$("#mini").addEventListener("click", toggleAudio);

// pemutar mini muncul saat panel lagu tidak terlihat
let started = false;
audio.addEventListener("play", () => { started = true; });
new IntersectionObserver(([e]) => {
  $("#mini").hidden = !(songType === "audio" && started && !e.isIntersecting);
}, { threshold: 0 }).observe(songPanel);

/* ---------- Surat ---------- */
function renderLetter(s, pengirim) {
  if (!s || !s.isi || !s.isi.length) { $(".panel--letter").hidden = true; return; }
  const el = $("#letter");
  const add = (text) => { const p = document.createElement("p"); p.textContent = text; el.append(p); };
  if (s.sapaan) add(s.sapaan);
  s.isi.forEach(add);
  const end = document.createElement("p");
  end.textContent = s.penutup || "";
  if (pengirim) {
    end.append(document.createElement("br"));
    const sig = document.createElement("span");
    sig.className = "letter__sign";
    sig.textContent = pengirim;
    end.append(sig);
  }
  el.append(end);
}

/* ---------- 3. Paralaks: hiasan ikut gerak HP / kursor / gulir ---------- */
const scene = $("#scene");
let tx = 0, ty = 0, cx = 0, cy = 0, rafOn = false;
function loop() {
  cx += (tx - cx) * 0.08;
  cy += (ty - cy) * 0.08;
  scene.style.setProperty("--px", cx.toFixed(2));
  scene.style.setProperty("--py", cy.toFixed(2));
  if (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) requestAnimationFrame(loop);
  else rafOn = false;
}
function aim(x, y) {
  tx = Math.max(-1, Math.min(1, x)) * 10;
  ty = Math.max(-1, Math.min(1, y)) * 10;
  if (!rafOn) { rafOn = true; requestAnimationFrame(loop); }
}
if (!reduceMotion) {
  window.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    aim(e.clientX / innerWidth * 2 - 1, e.clientY / innerHeight * 2 - 1);
  });
  window.addEventListener("scroll", () => {
    scene.style.setProperty("--sy", (scrollY * 0.04).toFixed(1));
  }, { passive: true });
}
function onTilt(e) {
  if (e.gamma == null) return;
  aim(e.gamma / 25, (e.beta - 45) / 25);
}
async function enableTilt() {
  if (reduceMotion || !("DeviceOrientationEvent" in window)) return;
  try {
    // iPhone meminta izin; harus dipanggil dari ketukan pengguna
    if (typeof DeviceOrientationEvent.requestPermission === "function") {
      if ((await DeviceOrientationEvent.requestPermission()) !== "granted") return;
    }
    window.addEventListener("deviceorientation", onTilt);
  } catch (_) { /* abaikan */ }
}

/* ---------- 4. Membuka kado ---------- */
function openBox() {
  if (songType === "audio") audio.play().catch(() => {}); // ketukan pengguna = lagu boleh diputar
  enableTilt();
  buzz(18);
  body.classList.add("is-opening", "is-open");
  const show = () => {
    $("#page").hidden = false;
    $("#intro").hidden = true;
    body.classList.remove("is-intro", "is-opening");
    window.scrollTo(0, 0);
    $("#name").focus({ preventScroll: true });
  };
  reduceMotion ? show() : setTimeout(show, 650);
}
$("#openBtn").addEventListener("click", openBox);

/* ---------- 5. Amplop & konfeti ---------- */
const env = $("#envelope");
$("#sealBtn").addEventListener("click", () => {
  env.style.setProperty("--envH", env.offsetHeight + "px");
  env.classList.add("is-open");
  $("#sealHint").hidden = true;
  buzz([12, 40, 18]);
  $("#secretCard").setAttribute("tabindex", "-1");
  setTimeout(() => $("#secretCard").focus({ preventScroll: true }), 900);
  const r = $("#sealBtn").getBoundingClientRect();
  confetti(r.left + r.width / 2, r.top + r.height / 2);
});

function confetti(x, y) {
  if (reduceMotion) return;
  const c = $("#confetti");
  const ctx = c.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  c.width = innerWidth * dpr; c.height = innerHeight * dpr;
  ctx.scale(dpr, dpr);
  const colors = ["#E2A84B", "#C8754E", "#7E9B95", "#E8B4A4", "#EBB592", "#FFF6E6"];
  const bits = Array.from({ length: 80 }, () => {
    const a = Math.random() * Math.PI * 2, v = 3 + Math.random() * 7;
    return { x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 6, s: 4 + Math.random() * 6,
      r: Math.random() * 6, vr: (Math.random() - .5) * .3, c: colors[(Math.random() * colors.length) | 0], star: Math.random() < .25 };
  });
  const t0 = performance.now();
  (function frame(t) {
    const life = (t - t0) / 1800;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    bits.forEach((b) => {
      b.vy += .26; b.vx *= .985; b.x += b.vx; b.y += b.vy; b.r += b.vr;
      ctx.save(); ctx.globalAlpha = Math.max(0, 1 - life); ctx.translate(b.x, b.y); ctx.rotate(b.r); ctx.fillStyle = b.c;
      if (b.star) { // bintang kecil seperti hiasan latar
        const s = b.s;
        ctx.beginPath(); ctx.moveTo(0, -s); ctx.quadraticCurveTo(0, 0, s, 0); ctx.quadraticCurveTo(0, 0, 0, s);
        ctx.quadraticCurveTo(0, 0, -s, 0); ctx.quadraticCurveTo(0, 0, 0, -s); ctx.fill();
      } else ctx.fillRect(-b.s / 2, -b.s / 4, b.s, b.s / 2 * Math.abs(Math.cos(b.r * 2)) + 1);
      ctx.restore();
    });
    if (life < 1) requestAnimationFrame(frame); else ctx.clearRect(0, 0, innerWidth, innerHeight);
  })(t0);
}

/* ---------- 6. Efek riak saat tombol disentuh ---------- */
document.addEventListener("pointerdown", (e) => {
  const el = e.target.closest(".btn, .player__btn, .seal");
  if (!el || reduceMotion) return;
  const r = el.getBoundingClientRect();
  const size = Math.max(r.width, r.height);
  const s = document.createElement("span");
  s.className = "ripple";
  s.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px`;
  el.append(s);
  s.addEventListener("animationend", () => s.remove());
});

/* ---------- Mulai ---------- */
(async function init() {
  const id = getId();
  requestAnimationFrame(() => requestAnimationFrame(() => body.classList.remove("is-loading")));
  if (!id) return showMissing();
  try {
    fill(await loadData(id));
    $("#openBtn").disabled = false;
  } catch (e) {
    showMissing();
  }
})();
