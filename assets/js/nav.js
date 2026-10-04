// Menu ringkas: tutup otomatis setelah tautan diklik atau klik di luar menu.
document.addEventListener("click", (e) => {
  const menu = document.querySelector(".menu[open]");
  if (!menu) return;
  if (e.target.closest(".menu__links a") || !menu.contains(e.target)) menu.open = false;
});
