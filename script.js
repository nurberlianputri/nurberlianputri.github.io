/* =============================================================
   SCRIPT.JS — Efek JavaScript untuk Portofolio Berlian
   Dipakai oleh semua halaman lewat <script src="script.js">.

   Isi file ini ada 3 efek:
   1. Terminal yang mengetik sendiri        (halaman Home)
   2. Skill bar yang terisi pelan-pelan      (halaman Tentang Saya)
   3. Kartu yang muncul saat di-scroll       (Home & Pengalaman)

   Tiap efek punya "pengaman": kalau elemennya tidak ada di
   halaman itu, efek tidak dijalankan. Jadi satu file ini aman
   dipasang di semua halaman.
   ============================================================= */

(function () {
  'use strict';

  // Kalau pengguna mengaktifkan "kurangi gerakan" di perangkatnya,
  // semua animasi kita lewati dan halaman tampil seperti biasa.
  const kurangGerak = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Fungsi kecil untuk "menunggu" sekian milidetik (dipakai efek mengetik)
  const tunggu = (ms) => new Promise((selesai) => setTimeout(selesai, ms));


  /* ===========================================================
     1. TERMINAL MENGETIK SENDIRI
     Teks di dalam kotak terminal sudah ada di index.html.
     JavaScript mengosongkannya dulu, lalu mengetiknya lagi
     huruf demi huruf. Jadi kalau JavaScript mati, teks asli
     tetap tampil.
     =========================================================== */
  async function terminalMengetik() {
    const badan = document.querySelector('.terminal-body');
    if (!badan || kurangGerak) return;

    const kursor = badan.querySelector('.cursor');
    if (!kursor) return;
    kursor.remove();                       // kursor kita pindah-pindahkan sendiri

    // Kunci tinggi kotak supaya tidak "loncat" saat teks bertambah
    badan.style.minHeight = badan.offsetHeight + 'px';

    // Simpan teks asli tiap baris, lalu kosongkan
    const daftarBaris = Array.from(badan.children).map((baris) => {
      const potongan = [];
      const jalan = document.createTreeWalker(baris, NodeFilter.SHOW_TEXT);
      while (jalan.nextNode()) {
        potongan.push({ node: jalan.currentNode, teks: jalan.currentNode.nodeValue });
      }
      potongan.forEach((p) => { p.node.nodeValue = ''; });
      return { baris, potongan };
    });

    badan.classList.add('mengetik');       // kursor berhenti berkedip saat mengetik
    await tunggu(500);

    for (let i = 0; i < daftarBaris.length; i++) {
      const { baris, potongan } = daftarBaris[i];
      baris.appendChild(kursor);           // kursor ikut di ujung baris yang sedang diketik

      // Baris pertama ("$ about me") diketik pelan seperti perintah asli,
      // baris lain lebih cepat seperti hasil keluaran program.
      const jeda = i === 0 ? 75 : 14;

      for (const p of potongan) {
        for (const huruf of p.teks) {
          p.node.nodeValue += huruf;
          await tunggu(jeda);
        }
      }
      await tunggu(i === 0 ? 450 : 60);
    }

    badan.classList.remove('mengetik');    // kursor berkedip lagi di baris terakhir
  }


  /* ===========================================================
     2. SKILL BAR TERISI PELAN-PELAN
     Lebar tiap bar (75%, 80%, dst.) tetap dibaca dari HTML.
     JavaScript hanya menahannya di 0% dulu, lalu mengisinya
     saat bar terlihat di layar (CSS yang membuat gerakannya halus).
     =========================================================== */
  function skillBarTerisi() {
    const bar = document.querySelectorAll('.skill-bar > span');
    if (!bar.length || kurangGerak || !('IntersectionObserver' in window)) return;

    bar.forEach((b) => {
      b.dataset.target = b.style.width;    // simpan lebar aslinya, misal "75%"
      b.style.width = '0%';                // mulai dari kosong
    });

    const pengamat = new IntersectionObserver((entri) => {
      let urutan = 0;
      entri.forEach((e) => {
        if (!e.isIntersecting) return;
        const isi = e.target.firstElementChild;
        isi.style.transitionDelay = (urutan * 120) + 'ms';   // bar terisi bergantian
        isi.style.width = isi.dataset.target;
        pengamat.unobserve(e.target);
        urutan++;
      });
    }, { threshold: 0.6 });

    // Yang diamati adalah wadah bar-nya (bukan isinya yang sedang lebar 0)
    document.querySelectorAll('.skill-bar').forEach((wadah) => pengamat.observe(wadah));
  }


  /* ===========================================================
     3. KARTU MUNCUL SAAT DI-SCROLL
     Kartu dan blok "Fakta Singkat" mulai transparan dan sedikit
     turun, lalu naik dan terlihat jelas ketika masuk layar.
     Kartu dalam satu baris muncul bergiliran.
     =========================================================== */
  function munculSaatScroll() {
    if (kurangGerak || !('IntersectionObserver' in window)) return;

    const daftar = document.querySelectorAll('.kartu, .float-wrapper');
    if (!daftar.length) return;

    // Beri nomor urut untuk elemen yang bersaudara (satu induk)
    const hitung = new Map();
    daftar.forEach((el) => {
      const n = hitung.get(el.parentElement) || 0;
      el.dataset.urutan = n;
      hitung.set(el.parentElement, n + 1);
    });

    const pengamat = new IntersectionObserver((entri) => {
      entri.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const tunda = Number(el.dataset.urutan) * 100;
        pengamat.unobserve(el);
        el.style.transitionDelay = tunda + 'ms';
        el.classList.add('tampil');

        // Setelah selesai, kembalikan ke gaya normal supaya efek
        // hover kartu (naik sedikit) tetap berjalan seperti semula.
        setTimeout(() => {
          el.classList.remove('reveal', 'tampil');
          el.style.transitionDelay = '';
        }, 800 + tunda);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    daftar.forEach((el) => {
      el.classList.add('reveal');
      pengamat.observe(el);
    });
  }


  /* ---------- Jalankan semuanya ---------- */
  terminalMengetik();
  skillBarTerisi();
  munculSaatScroll();
})();
