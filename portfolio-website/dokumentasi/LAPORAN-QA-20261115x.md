# Hasil uji efek kartu — PIR Visuals 20261115x

- Uji sintaks JS/Node: lulus.
- Uji regresi baru: dijalankan dengan `node --test tests/party-paper-20261115x.test.js tests/card-hover-motion-20261115x.test.js`.
- Chromium: pengujian mandiri pada representasi HTML kartu di 4 jenis halaman × 4 lebar layar (390, 768, 1365, 1920 px).
- Yang dicek: jumlah kartu, event hover, partikel 22 buah, pembersihan setelah animasi, lapisan kilau CSS, tidak ada horizontal overflow, serta tidak ada error JavaScript pada skenario tersebut.
- Pengaturan reduced-motion: periksa konfeti tidak dibuat dan animasi tambahan berhenti.

**Batas verifikasi:** pengujian ini tidak mencakup integrasi dengan database produksi atau tes seluruh backend. HTML fixture disusun mengikuti class dan struktur dari server, namun bukan simulasi penuh setiap halaman dengan database tersambung.
