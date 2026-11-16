/* =========================================================
   LUMI GIFT – logika micro-site
   Data setiap pesanan ada di /data/<id>.json
   Alamat halaman: /untuk/<id>   atau   /?u=<id>
   ========================================================= */

const CONFIG = {
  // Nomor WhatsApp LUMI GIFT (format 62...). Kosongkan untuk menyembunyikan tautan pemesanan.
  whatsapp: "",
  pesanWA: "Halo LUMI GIFT, saya mau pesan kado seperti ini.",
};

const $ = (s) => document.querySelector(s);
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
  $("#lid").hidden = true;
  $("#missing").hidden = false;
  document.body.classList.remove("is-closed");
}

/* ---------- 2. Isi halaman ---------- */
function fill(d) {
  document.title = `Untuk ${d.penerima} – LUMI GIFT`;
  $("#tagTo").textContent = `Untuk ${d.penerima}`;
  $("#tagFrom").textContent = d.pengirim ? `dari ${d.pengirim}` : "";
  $("#title").textContent = d.judul || `Untuk ${d.penerima}`;
  $("#meta").textContent = d.keterangan || "";

  renderPhotos(d.foto || []);
  renderSong(d.lagu);
  renderLetter(d.surat, d.pengirim);

  if (d.pesanRahasia) $("#secretText").textContent = d.pesanRahasia;
  else $(".part--secret").hidden = true;

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
  if (!list.length) { $(".part--photos").hidden = true; return; }
  const n = list.length;
  wrap.className = "prints " + (n <= 4 ? `prints--${n}` : "prints--n");
  list.forEach((f, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "print";
    const spans = (n === 3 && i === 0) || (n === 4 && i === 0) || (n > 4 && i === 0);
    if (spans) b.classList.add("print--span");
    const frame = document.createElement("span");
    frame.className = "print__frame";
    b.setAttribute("aria-label", `Lihat foto ${i + 1}${f.caption ? ": " + f.caption : ""}`);
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
  });
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
const slip = $("#slip");
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
  if (!lagu || !lagu.src) { $(".part--song").hidden = true; return; }
  songType = lagu.tipe || "audio";
  $("#songTitle").textContent = lagu.judul || "Lagu kenangan";
  $("#songArtist").textContent = lagu.artis || "";
  $("#songNote").textContent = lagu.catatan || "";

  if (songType === "audio") {
    audio.src = lagu.src;
    return;
  }
  // Spotify / YouTube: pakai pemutar resmi
  const url = embedUrl(lagu);
  $("#player").hidden = true;
  const box = $("#embed");
  if (!url) { box.hidden = false; box.textContent = "Tautan lagu belum benar. Periksa kembali link Spotify/YouTube di data pesanan."; return; }
  const ifr = document.createElement("iframe");
  ifr.src = url;
  ifr.loading = "lazy";
  ifr.title = `Pemutar lagu ${lagu.judul || ""}`;
  ifr.allow = "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
  if (songType === "spotify") ifr.height = 152;
  box.className = "embed" + (songType === "youtube" ? " embed--yt" : "");
  box.append(ifr);
  box.hidden = false;
}

const fmt = (s) => (isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}` : "0:00");
const seek = $("#seek");
function setPlaying(on) {
  slip.classList.toggle("is-playing", on);
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

// tampilkan pemutar mini saat slip lagu tidak terlihat dan lagu pernah diputar
let started = false;
audio.addEventListener("play", () => { started = true; });
new IntersectionObserver(([e]) => {
  $("#mini").hidden = !(songType === "audio" && started && !e.isIntersecting);
}, { threshold: 0 }).observe(slip);

/* ---------- Surat ---------- */
function renderLetter(s, pengirim) {
  if (!s || !s.isi || !s.isi.length) { $(".part--letter").hidden = true; return; }
  const el = $("#letter");
  const add = (text, cls) => { const p = document.createElement("p"); p.textContent = text; if (cls) p.className = cls; el.append(p); };
  if (s.sapaan) add(s.sapaan);
  s.isi.forEach((t) => add(t));
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

/* ---------- 3. Membuka kotak ---------- */
function openBox() {
  const body = document.body;
  if (songType === "audio") audio.play().catch(() => {}); // klik pengguna = lagu boleh diputar
  $("#box").hidden = false;
  window.scrollTo(0, 0);
  body.classList.add("is-opening");
  const done = () => {
    $("#lid").hidden = true;
    body.classList.remove("is-closed", "is-opening");
    $("#title").setAttribute("tabindex", "-1");
    $("#title").focus({ preventScroll: true });
  };
  reduceMotion ? done() : setTimeout(done, 1600);
}
$("#openBtn").addEventListener("click", openBox);

/* ---------- 4. Amplop & konfeti ---------- */
const env = $("#envelope");
$("#sealBtn").addEventListener("click", () => {
  env.style.setProperty("--envH", env.offsetHeight + "px");
  env.classList.add("is-open");
  $("#sealHint").hidden = true;
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
  const colors = ["#C0704F", "#D88E6D", "#EED6C0", "#FBF7F0", "#964F33", "#E7C7AB"];
  const bits = Array.from({ length: 90 }, () => {
    const a = Math.random() * Math.PI * 2, v = 4 + Math.random() * 7;
    return { x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 6, w: 6 + Math.random() * 6, h: 3 + Math.random() * 4,
      r: Math.random() * 6, vr: (Math.random() - .5) * .4, c: colors[(Math.random() * colors.length) | 0] };
  });
  const t0 = performance.now();
  (function frame(t) {
    const life = (t - t0) / 1800;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    bits.forEach((b) => {
      b.vy += .28; b.vx *= .985; b.x += b.vx; b.y += b.vy; b.r += b.vr;
      ctx.save(); ctx.globalAlpha = Math.max(0, 1 - life); ctx.translate(b.x, b.y); ctx.rotate(b.r);
      ctx.fillStyle = b.c; ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h * Math.abs(Math.cos(b.r * 2))); ctx.restore();
    });
    if (life < 1) requestAnimationFrame(frame); else ctx.clearRect(0, 0, innerWidth, innerHeight);
  })(t0);
}

/* ---------- Mulai ---------- */
(async function init() {
  const id = getId();
  if (!id) return showMissing();
  try {
    fill(await loadData(id));
    $("#openBtn").disabled = false;
  } catch (e) {
    showMissing();
  }
})();
