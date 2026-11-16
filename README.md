# LUMI GIFT – Micro-site Kado

Template halaman kado digital yang dibuka dengan memindai QR Code di kartu ucapan.
Dibuat dengan HTML, CSS, dan JavaScript murni, tanpa framework dan tanpa database.

## Struktur folder

```
index.html            halaman utama (satu template untuk semua pesanan)
css/style.css         tampilan
js/app.js             logika: baca data, pemutar lagu, foto, amplop
data/rara.json        data satu pesanan (contoh)
assets/pesanan/rara/  foto & lagu milik pesanan "rara"
assets/brand/logo.png logo LUMI GIFT
fonts/                font (Gloock, Bricolage Grotesque, Kalam) disimpan lokal
_redirects            aturan Cloudflare Pages agar /untuk/<id> bisa dibuka
```

## Menambah pesanan baru

1. Buat folder `assets/pesanan/<id>/`, misalnya `assets/pesanan/budi-sempro/`.
   Id hanya boleh huruf kecil, angka, dan tanda minus.
2. Masukkan foto (kompres dulu ke ±300 KB, format .jpg atau .webp).
3. Salin `data/rara.json` menjadi `data/budi-sempro.json`, lalu ubah isinya.
4. Upload ke GitHub, dan Cloudflare Pages akan memperbaruinya otomatis.
5. Alamat halamannya: `https://<nama-proyek>.pages.dev/untuk/budi-sempro`.
   Ubah alamat ini menjadi QR Code, lalu cetak di kartu.

## Isi file data

| Kolom | Keterangan |
|---|---|
| `penerima`, `pengirim` | Nama yang tampil di label kado dan tanda tangan surat |
| `judul` | Judul besar di halaman, contoh "Selamat sempro, Budi." |
| `keterangan` | Teks kecil di bawah judul (boleh dikosongkan) |
| `foto` | 1–6 foto. Tata letak menyesuaikan jumlah foto. `posisi` opsional, contoh `"center top"` agar wajah tidak terpotong |
| `lagu` | Lihat bagian di bawah |
| `surat` | `sapaan`, `isi` (daftar paragraf), `penutup` |
| `pesanRahasia` | Pesan di dalam amplop. Usahakan di bawah 150 karakter |

Bagian yang dihapus dari JSON (misalnya tidak ada `pesanRahasia`) akan otomatis disembunyikan.

## Pilihan lagu

```json
"lagu": { "tipe": "spotify", "src": "https://open.spotify.com/track/xxxx", "judul": "...", "artis": "...", "catatan": "..." }
"lagu": { "tipe": "youtube", "src": "https://youtu.be/xxxx", "judul": "...", "artis": "..." }
"lagu": { "tipe": "audio",   "src": "/assets/pesanan/rara/lagu.mp3", "judul": "...", "artis": "..." }
```

- `spotify` / `youtube`: memakai pemutar resmi, aman dari sisi hak cipta. Disarankan untuk lagu populer.
- `audio`: file sendiri, misalnya rekaman suara pengirim. Lagu langsung berputar saat kotak dibuka.
  Lagu pada contoh `rara` adalah melodi kotak musik buatan sendiri, bebas dipakai.

## Mencoba di laptop

Buka folder ini di VS Code, jalankan ekstensi **Live Server**, lalu buka
`http://127.0.0.1:5500/?u=rara`.
(Alamat `/untuk/rara` hanya berjalan setelah di-deploy ke Cloudflare Pages.)

## Deploy ke Cloudflare Pages (gratis)

1. Upload folder ini ke repository GitHub.
2. Masuk ke dash.cloudflare.com, buka **Workers & Pages**, lalu **Create**, pilih **Pages**, dan hubungkan repository.
3. Framework preset: **None**. Build command: kosong. Output directory: `/`.
4. Setelah selesai, situs bisa dibuka di `https://<nama-proyek>.pages.dev/untuk/rara`.

## Tautan pemesanan

Isi nomor WhatsApp LUMI GIFT di `js/app.js` bagian `CONFIG.whatsapp` (format `62812...`).
Tautan "Pesan kado seperti ini" akan muncul di bagian bawah setiap halaman kado.

Foto pada contoh `rara` hanyalah ilustrasi pengganti. Ganti dengan foto asli dari pemesan.
