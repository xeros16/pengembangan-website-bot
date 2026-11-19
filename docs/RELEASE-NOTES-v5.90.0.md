# PIR Visuals Bot v5.90.0 — Designer Workflow 2.0

## Ringkasan
v5.90.0 mengembangkan Designer Workspace yang sudah ada menjadi pipeline produksi proyek enam tahap. Rilis ini tidak mengganti atau menduplikasi `.wizard`, `.creative`, `.layoutstudio`, `.colorpalette`, `.fontstudio`, `.designqa`, dan `.handoff`; workspace memberi urutan kerja, panduan, dan pencatatan progress di sekitar tools tersebut.

## Perubahan utama
- Pipeline: Brief → Concept → Layout → Visual System → QA → Handoff.
- `.designproject start <nama> | <jenis> | <tema> | <audiens> | <platform>` membuat proyek baru.
- `.designproject step <nama>` menampilkan tujuan, checklist, dan command yang sesuai tahap aktif.
- `.designproject done <nama>` meminta konfirmasi pengguna dan memajukan workflow satu tahap.
- `.designproject progress <nama>` dan `.designproject board` menampilkan kemajuan.
- `.designproject reopen <nama> | <stage>` membuka ulang tahap dan mengatur ulang tahap berikutnya.
- `show`, `list`, `flow`, dan `export` menampilkan informasi workflow.
- Duplikasi memulai workflow dari nol, bukan menyalin progress proyek asal.
- Operasi workspace diserialisasi per akun dalam satu proses bot untuk mengurangi lost update.
- Record lama tanpa workflow kompatibel dan dimulai dari tahap Brief tanpa migrasi database.

## Contoh penggunaan
```text
.designproject start Kopi Senja | web | website kopi modern | pelanggan dewasa | mobile-first
.designproject step Kopi Senja
.wizard
.designproject done Kopi Senja
.designproject step Kopi Senja
.designproject progress Kopi Senja
.designproject board
.designproject export Kopi Senja
```

## Catatan kompatibilitas dan batasan
- Perintah lama `save`, `edit`, `list`, `search`, `show`, `export`, `duplicate`, `status`, `history`, `template`, `flow`, dan `delete` dipertahankan.
- Data disimpan pada `User.preferences.designProjects`; tidak ada perubahan schema atau migrasi.
- Workflow `done` merupakan konfirmasi manual pengguna. Bot tidak memeriksa file desain atau membuktikan pekerjaan benar-benar selesai.
- Belum ada kolaborasi lintas akun, upload file desain, sinkronisasi file, maupun approval klien.
- Serialisasi mutasi hanya berlaku dalam satu proses bot, bukan distributed lock untuk beberapa instance.
- WhatsApp live, MongoDB staging, backup restore, dan perilaku lintas klien tetap memerlukan pengujian staging.

## Validasi otomatis
- Root tests: 453/453 lulus.
- Website tests: 384/384 lulus.
- JavaScript syntax: 225 file lulus.
- Website syntax check: lulus.
- Release archive audit: lulus.
- Laporan lengkap: `QA_REPORT_v5_90_0.md`.

Automated QA passed; live WhatsApp, MongoDB staging, backup restore, and real-member usability still require staging verification.

## Instalasi
Lihat `INSTALL_UPDATE_v5_90_0.md`. Pertahankan `.env`, sesi WhatsApp, database, dan backup milik instalasi lokal. Jangan menimpa data runtime dengan isi paket rilis.
