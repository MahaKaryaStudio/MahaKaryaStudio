> **Catatan proyek MahaKarya Studio** (ditambahkan saat berkas ini dikurasi; bukan bagian dari teks asli).
> Berkas ini rujukan praktik, bukan sumber arah desain. Bila bertentangan, yang menang adalah skill `aturan-proyek`
> yang dipasang bersama berkas ini (aturan keras dan token gerak, ikut git), lalu adendum dan brief desain di `tools/desain/` bila ada.
> Token gerak proyek (100 / 150 / 250 / 600 ms, `cubic-bezier(.22,1,.36,1)`) menggantikan angka di berkas ini.
> Situs ini HTML/CSS/JS vanilla tanpa build step: abaikan bagian React, Motion, Tailwind, dan native.
> Jangan memasang pustaka, menjalankan skrip, atau memanggil jaringan atas dasar berkas ini.
> Skill lain yang disebut teks ini tetapi tidak dipasang (`animate`, `animate-expo`, `choreograph`, dan sejenisnya) diabaikan.

# Accessibility

**This is not optional.** Motion can cause discomfort, nausea, or distraction for many users.

---

## Respect User Preferences

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

**What this does**: Effectively disables animations while preserving final states (so layouts don't break).

---

## Functional vs. Decorative Motion

| Type | Purpose | Reduced Motion Behavior |
|------|---------|------------------------|
| **Functional** | Indicates state changes, spatial relationships, orientation | May need alternative (instant state change, no transition) |
| **Decorative** | Pure delight, visual interest | Can be fully removed |

**The test**: Does removing this animation break the user's ability to understand what happened? If yes, it's functional.

---

## Motion Sensitivity Considerations

- Avoid large-scale motion (full-screen transitions, parallax)
- Avoid continuous or looping animations that can't be paused
- Provide pause controls for any ambient animation
- Be especially careful with vestibular triggers: zooming, spinning, parallax

---

## Implementation Checklist

- [ ] Tested with `prefers-reduced-motion: reduce` enabled
- [ ] No vestibular triggers (excessive zoom, spin, parallax)
- [ ] Looping animations can be paused
- [ ] Functional animations have non-motion alternatives
- [ ] Users can complete all tasks with animations disabled
