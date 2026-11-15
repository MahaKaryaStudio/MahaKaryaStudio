# Skill agen untuk repo ini

Folder ini dibaca oleh agen penyunting kode (bukan oleh situs) dan tidak ikut tayang:
`.github/workflows/pages.yml` mengecualikan `.claude`.

Isinya hanya markdown. Tidak ada skrip, hook, atau aset. Tidak ada install script
pihak ketiga yang pernah dijalankan; pemasangan = menyalin berkas yang sudah dibaca.

## Urutan wewenang

1. `aturan-proyek/` (ditulis untuk proyek): aturan keras, token gerak, aturan performa gerak.
2. Skill pihak ketiga di bawah: rujukan praktik dan daftar periksa. Bila bertentangan dengan
   `aturan-proyek`, `aturan-proyek` yang menang.

## Sumber pihak ketiga

Semua berlisensi MIT. Teks lisensi asli beserta pemegang hak cipta ada di `LICENSE.md`
tiap folder. Setiap berkas diberi blok "Catatan proyek" di kepala, dan bagian yang
memerintahkan agen menjalankan alat pack (yang tidak dipasang) sudah dibuang atau ditandai.

| Folder | Sumber | Commit | Berkas asal |
| --- | --- | --- | --- |
| `animation-performance/` | emilkowalski/skill | 0f2e23b | skills/animation-performance/SKILL.md |
| `review-animations/` | emilkowalski/skill | 0f2e23b | skills/review-animations/SKILL.md, STANDARDS.md |
| `mobile-native/` | emilkowalski/skill | 0f2e23b | skills/mobile-native/SKILL.md |
| `motion-slop-check/` | kylezantos/design-motion-principles | 4a9ca87 | references/anti-checklist.md, accessibility.md, performance.md |
| `tells/` | AThevon/genjutsu | 79b10cf | skills/_jutsu/tells/SKILL.md, references/web.md |
| `copy-tells/` | Leonxlnx/taste-skill | f6b7657 | skills/taste-skill/references/copy-tells.md |
| `ux-quick-reference/` | nextlevelbuilder/ui-ux-pro-max-skill | d643997 | .claude/skills/ui-ux-pro-max/references/quick-reference.md |

## Yang sengaja tidak dipasang

- **Taste Skill `SKILL.md` dan skripnya**: frontmatter-nya mendaftarkan hook Stop yang
  menjalankan skrip pack setiap agen berhenti, dan aturannya melarang keterangan pada gambar
  (akan membuang pil "ILUSTRASI").
- **GSAP skills** (greensock/gsap-skills): situs tidak memakai GSAP. Uji bangun ulang lapisan
  gulir dengan GSAP + ScrollTrigger menambah 46 KB gzip tanpa perbaikan per frame.
  Aturan performanya yang bebas pustaka ditulis ulang di `aturan-proyek`.
- **three.js skills** (CloudAI-X/threejs-skills): tampilan 3D ditunda dan bergerbang; tidak ada
  kode three.js di situs.
- **Design DNA** (zanwei/design-dna): skema, bukan skill.
- **UI UX Pro Max generator dan CLI**: sarannya bertentangan dengan brief desain; hanya daftar
  periksa satu barisnya yang dipakai.
