export const MYSTERY_CASES = Object.freeze([
  {
    id: 'jam-menara', title: 'Misteri Jam Menara', difficulty: 'mudah',
    story: 'Penjaga menara, Pak Arman, ditemukan meninggal di ruang jam pada pukul 21.00. Tidak ada kerusakan pintu. Polisi memastikan peristiwa itu terjadi setelah jam menara berhenti.',
    suspects: ['Lila', 'Bram', 'Danu'], culprit: 'bram',
    clues: [
      'Lila, penjaga taman, berkata ia berada di halaman. Sepatunya basah karena hujan yang mulai turun pukul 20.30.',
      'Danu, kurir, mengaku datang pukul 20.00, tetapi buku tamu mencatat ia keluar pukul 20.10.',
      'Bram berkata jam menara sudah berhenti sejak pukul 19.00. Padahal hanya petugas ruang jam yang diberi tahu bahwa jam itu baru berhenti pukul 20.45.'
    ],
    solution: 'Bram. Ia mengetahui waktu berhentinya jam yang tidak diumumkan kepada umum. Keterangan itu menunjukkan ia berada di ruang jam setelah pukul 20.45 dan berbohong tentang keberadaannya.',
    locations: [{ code: 'menara', name: 'Ruang Menara', description: 'Ruang sempit berisi mekanisme jam dan buku perawatan.' }, { code: 'halaman', name: 'Halaman Menara', description: 'Halaman terbuka yang basah setelah hujan.' }, { code: 'pos', name: 'Pos Penjaga', description: 'Tempat buku tamu dan catatan kunjungan disimpan.' }],
    evidence: [{ code: 'catatan', name: 'Catatan perawatan', location: 'menara', detail: 'Catatan menunjukkan jam baru berhenti pada pukul 20.45.' }, { code: 'sepatu', name: 'Jejak sepatu basah', location: 'halaman', detail: 'Jejak mengarah dari halaman ke pintu samping menara.' }, { code: 'bukutamu', name: 'Buku tamu', location: 'pos', detail: 'Danu tercatat meninggalkan menara pada pukul 20.10.' }],
    interviews: { 'lila': 'Aku berada di halaman. Hujan mulai turun sekitar pukul 20.30.', 'bram': 'Jam itu sudah berhenti sejak pukul 19.00. Aku tidak masuk ruang menara.', 'danu': 'Aku hanya mengantar paket dan pergi sebelum pukul 20.15.' }
  },
  {
    id: 'galeri-senja', title: 'Kasus Lukisan Galeri Senja', difficulty: 'sedang',
    story: 'Kurator galeri, Mira, ditemukan meninggal di ruang arsip pada pagi hari. Sebuah lukisan langka hilang. Pintu galeri terkunci dari dalam dan alarm tidak berbunyi.',
    suspects: ['Reno', 'Siska', 'Tara'], culprit: 'siska',
    clues: [
      'Reno, petugas keamanan, menunjukkan rekaman bahwa ia berpatroli di lobi pada pukul 22.00.',
      'Tara, pelukis, mengirim pesan kepada Mira pukul 21.40 dan menerima balasan yang tercatat di ponsel Mira.',
      'Siska, teknisi, mengatakan alarm mati karena kabelnya dicabut. Namun pemeriksaan menunjukkan alarm tetap aktif; sistem dimatikan memakai kode teknisi miliknya.'
    ],
    solution: 'Siska. Hanya teknisi yang mengetahui kode untuk menonaktifkan sistem. Ia mengarang cerita kabel dicabut untuk menutupi penggunaan kode aksesnya.',
    locations: [{ code: 'arsip', name: 'Ruang Arsip', description: 'Rak dokumen dan tempat lukisan disimpan sementara.' }, { code: 'lobi', name: 'Lobi Galeri', description: 'Area penerima tamu dengan monitor keamanan.' }, { code: 'panel', name: 'Ruang Panel', description: 'Panel alarm dan log akses teknisi berada di sini.' }],
    evidence: [{ code: 'logalarm', name: 'Log alarm', location: 'panel', detail: 'Alarm dimatikan memakai kode teknisi, bukan karena kabel terputus.' }, { code: 'rekaman', name: 'Rekaman lobi', location: 'lobi', detail: 'Reno terlihat berpatroli di lobi pada pukul 22.00.' }, { code: 'pesan', name: 'Pesan ponsel', location: 'arsip', detail: 'Balasan Mira kepada Tara tercatat pada pukul 21.40.' }],
    interviews: { 'reno': 'Aku berpatroli di lobi. Rekaman kamera seharusnya membuktikannya.', 'siska': 'Alarm mati karena kabelnya dicabut. Aku tidak menggunakan kode teknisi.', 'tara': 'Aku mengirim pesan kepada Mira pukul 21.40 dan mendapat balasan.' }
  },
  {
    id: 'kereta-terakhir', title: 'Rahasia Kereta Terakhir', difficulty: 'sulit',
    story: 'Seorang pengusaha ditemukan meninggal di gerbong privat setelah kereta tiba di stasiun akhir. Tiga orang sempat mengunjunginya. Tidak ada adegan kekerasan yang perlu diperiksa; kasus ini dipecahkan dari jadwal dan kesaksian.',
    suspects: ['Niko', 'Vera', 'Yusuf'], culprit: 'vera',
    clues: [
      'Niko berkata ia turun di Stasiun Utara pukul 20.15. Tiket elektronik membuktikan ia keluar dari stasiun itu.',
      'Yusuf mengaku tidak pernah masuk gerbong privat. Petugas melihatnya hanya di gerbong makan.',
      'Vera berkata ia mengunjungi korban setelah kereta melewati Stasiun Selatan pukul 20.40. Namun jadwal resmi menunjukkan kereta sudah tiba di stasiun akhir pukul 20.30.'
    ],
    solution: 'Vera. Kesaksiannya mustahil sesuai jadwal kereta: ia mengaku melakukan kunjungan setelah kereta tiba di tujuan. Keterangan waktunya dibuat-buat.',
    locations: [{ code: 'gerbong', name: 'Gerbong Privat', description: 'Tempat korban terakhir terlihat dan jadwal kunjungan dicatat.' }, { code: 'makan', name: 'Gerbong Makan', description: 'Pelayan mencatat pergerakan penumpang.' }, { code: 'utara', name: 'Stasiun Utara', description: 'Pemeriksaan tiket elektronik tersimpan di sistem.' }],
    evidence: [{ code: 'jadwal', name: 'Jadwal perjalanan', location: 'gerbong', detail: 'Kereta tiba di stasiun akhir pukul 20.30, lebih awal dari waktu kunjungan yang diklaim Vera.' }, { code: 'tiket', name: 'Data tiket Niko', location: 'utara', detail: 'Tiket Niko menunjukkan ia keluar di Stasiun Utara pukul 20.15.' }, { code: 'catatanpelayan', name: 'Catatan pelayan', location: 'makan', detail: 'Yusuf tercatat berada di gerbong makan selama rentang waktu penting.' }],
    interviews: { 'niko': 'Aku turun di Stasiun Utara pukul 20.15.', 'vera': 'Aku menemui korban setelah kereta melewati Stasiun Selatan pukul 20.40.', 'yusuf': 'Aku berada di gerbong makan dan tidak masuk gerbong privat.' }
  },
  {
    id: 'observatorium', title: 'Bayangan di Observatorium', difficulty: 'sedang',
    story: 'Kepala observatorium ditemukan meninggal di ruang kendali pada malam pengamatan. Data teleskop diubah sehingga waktu kejadian tampak berbeda. Tiga staf dimintai keterangan.',
    suspects: ['Adit', 'Nara', 'Fikri'], culprit: 'fikri',
    clues: [
      'Adit sedang memandu pengunjung di aula. Foto acara memiliki cap waktu 21.05.',
      'Nara menyimpan catatan pengamatan manual yang cocok dengan log server sebelum perubahan.',
      'Fikri berkata ia tidak memiliki akses server. Namun daftar akses mencatat akun miliknya mengubah jam sistem pada 21.12.'
    ],
    solution: 'Fikri. Log server menunjukkan akun miliknya mengubah jam sistem, bertentangan dengan pengakuannya bahwa ia tidak punya akses.',
    locations: [{ code: 'kendali', name: 'Ruang Kendali', description: 'Terminal teleskop dan panel kontrol utama.' }, { code: 'aula', name: 'Aula Pengunjung', description: 'Tempat acara pengamatan berlangsung.' }, { code: 'server', name: 'Ruang Server', description: 'Log akses dan catatan waktu sistem disimpan.' }],
    evidence: [{ code: 'log', name: 'Log server', location: 'server', detail: 'Akun Fikri mengubah jam sistem pada pukul 21.12.' }, { code: 'foto', name: 'Foto acara', location: 'aula', detail: 'Foto bertanda waktu 21.05 menunjukkan Adit sedang memandu pengunjung.' }, { code: 'catatanmanual', name: 'Catatan pengamatan', location: 'kendali', detail: 'Catatan manual Nara cocok dengan log server sebelum perubahan.' }],
    interviews: { 'adit': 'Aku memandu pengunjung di aula. Ada foto dengan cap waktu.', 'nara': 'Catatan manualku cocok dengan data sebelum jam sistem diubah.', 'fikri': 'Aku tidak memiliki akses ke server observatorium.' }
  }
]);

export function normalizeMysteryAnswer(value = '') {
  return String(value).normalize('NFKD').toLowerCase().replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}

export function getMysteryCase(id) {
  return MYSTERY_CASES.find(item => item.id === id) || null;
}
