# Huruf (disimpan sendiri, adendum v3.1 K7)

Berkas woff2 diambil apa adanya dari paket npm Fontsource (lewat `npm pack` di luar repo, tanpa pengubahan):

| Berkas | Paket | Ukuran |
|---|---|---|
| `fraunces-latin-opsz-normal.woff2` | `@fontsource-variable/fraunces@5.3.0` | 67.304 B |
| `fraunces-latin-opsz-italic.woff2` | `@fontsource-variable/fraunces@5.3.0` | 81.520 B |
| `inter-latin-wght-normal.woff2` | `@fontsource-variable/inter@5.3.0` | 48.256 B |
| `dm-mono-latin-400-normal.woff2` | `@fontsource/dm-mono@5.0.20` | 14.872 B |
| `dm-mono-latin-500-normal.woff2` | `@fontsource/dm-mono@5.0.20` | 15.024 B |

Total 226.976 B. Ketiganya berlisensi SIL Open Font License 1.1: `OFL-fraunces.txt`, `OFL-inter.txt`,
`OFL-dm-mono.txt` (berkas LICENSE paketnya). `@font-face` ada di `assets/css/base.css`; hanya Fraunces roman
yang di-preload (index.html, koleksi.html).
