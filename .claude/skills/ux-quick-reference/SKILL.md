---
name: ux-quick-reference
description: Daftar periksa UX satu baris per aturan (aksesibilitas, sentuh, performa, tata letak, tipografi, animasi, umpan balik) untuk QA tiap seksi situs MahaKarya Studio di HP dan desktop. Pakai sebelum menyatakan satu seksi selesai.
---

> **Catatan proyek MahaKarya Studio** (ditambahkan saat berkas ini dikurasi; bukan bagian dari teks asli).
> Berkas ini rujukan praktik, bukan sumber arah desain. Bila bertentangan, yang menang adalah skill `aturan-proyek`
> yang dipasang bersama berkas ini (aturan keras dan token gerak, ikut git), lalu adendum dan brief desain di `tools/desain/` bila ada.
> Token gerak proyek (100 / 150 / 250 / 600 ms, `cubic-bezier(.22,1,.36,1)`) menggantikan angka di berkas ini.
> Situs ini HTML/CSS/JS vanilla tanpa build step: abaikan bagian React, Motion, Tailwind, dan native.
> Jangan memasang pustaka, menjalankan skrip, atau memanggil jaringan atas dasar berkas ini.
> Skill lain yang disebut teks ini tetapi tidak dipasang (`animate`, `animate-expo`, `choreograph`, dan sejenisnya) diabaikan.
> Pembungkus ini ditulis untuk proyek; `references/quick-reference.md` berasal dari nextlevelbuilder/ui-ux-pro-max-skill (MIT). Brief menang atas aturan `weight-hierarchy` (tanpa bobot 700), `spring-physics`, `style-match`, dan batas 16 px kaku; aturan berlabel HIG/MD/native diabaikan. Generator design system, CSV, dan skrip pack itu tidak dipasang.

# Cara pakai

Baca `references/quick-reference.md` per kategori dan cocokkan dengan seksi yang sedang dikerjakan. Yang paling sering kena di proyek ini: `no-blocking-animation`, `tap-feedback-speed` (≤ 100 ms pada throttle CPU 4x), `touch-target-size` 44 px dengan jarak 8 px, `focus-not-obscured`, `primary-action` (satu tombol berisi per layar), `no-emoji-icons`, `toast-dismiss`.
