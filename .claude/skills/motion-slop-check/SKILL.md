---
name: motion-slop-check
description: Saringan gerak "AI-slop" dan daftar periksa reduced-motion serta performa untuk meninjau perubahan gerak di situs MahaKarya Studio. Pakai saat meninjau diff CSS/JS yang menambah transisi, animasi, hover, atau stagger.
---

> **Catatan proyek MahaKarya Studio** (ditambahkan saat berkas ini dikurasi; bukan bagian dari teks asli).
> Berkas ini rujukan praktik, bukan sumber arah desain. Bila bertentangan, yang menang adalah skill `aturan-proyek`
> yang dipasang bersama berkas ini (aturan keras dan token gerak, ikut git), lalu adendum dan brief desain di `tools/desain/` bila ada.
> Token gerak proyek (100 / 150 / 250 / 600 ms, `cubic-bezier(.22,1,.36,1)`) menggantikan angka di berkas ini.
> Situs ini HTML/CSS/JS vanilla tanpa build step: abaikan bagian React, Motion, Tailwind, dan native.
> Jangan memasang pustaka, menjalankan skrip, atau memanggil jaringan atas dasar berkas ini.
> Skill lain yang disebut teks ini tetapi tidak dipasang (`animate`, `animate-expo`, `choreograph`, dan sejenisnya) diabaikan.
> Pembungkus ini ditulis untuk proyek; tiga berkas rujukan di `references/` berasal dari kylezantos/design-motion-principles (MIT) tanpa diubah selain catatan ini. Jangan membuat laporan HTML, jangan membuka browser, jangan menunggu konfirmasi bobot desainer.

# Cara pakai

1. Baca `references/anti-checklist.md`: tandai pola menurut heuristik frekuensinya (denyut, blur di semua entrance, hover-scale di banyak komponen, stagger di banyak daftar, pegas memantul, entrance pada teks statis).
2. Baca `references/accessibility.md`: setiap gerak punya jalur `prefers-reduced-motion` dan `html.motion-off`; loop bisa dijeda.
3. Baca `references/performance.md`: hanya transform/opacity, `will-change` hemat.
4. Laporkan temuan sebagai `berkas:baris`, pola, dan perbaikan memakai token proyek. Contoh JSX di rujukan hanya ilustrasi.
