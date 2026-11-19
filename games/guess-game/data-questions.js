// Bank soal dibuat lintas topik agar permainan tidak hanya berisi dunia desain.
export const GUESS_CATEGORIES = {
  campuran: { label: 'Campuran', emoji: '🎲' },
  umum: { label: 'Pengetahuan Umum', emoji: '🧠' },
  sains: { label: 'Sains & Alam', emoji: '🔬' },
  teknologi: { label: 'Teknologi', emoji: '💻' },
  geografi: { label: 'Geografi', emoji: '🌍' },
  hewan: { label: 'Hewan', emoji: '🐾' },
  makanan: { label: 'Makanan', emoji: '🍜' },
  olahraga: { label: 'Olahraga', emoji: '⚽' },
  sejarah: { label: 'Sejarah', emoji: '🏛️' },
  desain: { label: 'Desain', emoji: '🎨' },
  logika: { label: 'Teka-teki Logika', emoji: '🧩' },
};

export const GUESS_QUESTIONS = [
  { answer: 'CANVA', category: 'desain', hint: 'Platform desain grafis berbasis web.' },
  { answer: 'PHOTOSHOP', category: 'desain', hint: 'Aplikasi untuk mengolah dan menyunting foto.' },
  { answer: 'FIGMA', category: 'desain', hint: 'Alat kolaborasi untuk membuat UI/UX.' },
  { answer: 'TIPOGRAFI', category: 'desain', hint: 'Seni mengatur huruf agar mudah dibaca dan menarik.' },
  { answer: 'MATAHARI', category: 'sains', hint: 'Bintang yang menjadi pusat tata surya kita.' },
  { answer: 'OKSIGEN', category: 'sains', hint: 'Gas yang dibutuhkan manusia untuk bernapas.' },
  { answer: 'GRAVITASI', category: 'sains', hint: 'Gaya yang membuat benda tertarik menuju bumi.' },
  { answer: 'FOTOSINTESIS', category: 'sains', hint: 'Proses tumbuhan membuat makanan dengan bantuan cahaya.' },
  { answer: 'PROSESOR', category: 'teknologi', hint: 'Komponen komputer yang menjalankan instruksi.' },
  { answer: 'BLUETOOTH', category: 'teknologi', hint: 'Teknologi komunikasi nirkabel jarak dekat.' },
  { answer: 'ROUTER', category: 'teknologi', hint: 'Perangkat jaringan yang meneruskan paket antarjaringan.' },
  { answer: 'ALGORITMA', category: 'teknologi', hint: 'Urutan langkah logis untuk menyelesaikan masalah.' },
  { answer: 'JEPANG', category: 'geografi', hint: 'Negara kepulauan di Asia Timur yang beribu kota Tokyo.' },
  { answer: 'AMAZON', category: 'geografi', hint: 'Sungai besar di Amerika Selatan.' },
  { answer: 'EVEREST', category: 'geografi', hint: 'Gunung tertinggi di atas permukaan laut.' },
  { answer: 'KOMPAS', category: 'geografi', hint: 'Alat untuk menunjukkan arah mata angin.' },
  { answer: 'KOMODO', category: 'hewan', hint: 'Kadal besar yang hidup alami di beberapa pulau Indonesia.' },
  { answer: 'LUMBA LUMBA', category: 'hewan', hint: 'Mamalia laut cerdas yang sering melompat di permukaan air.' },
  { answer: 'KELELAWAR', category: 'hewan', hint: 'Mamalia yang dapat terbang dan umumnya aktif malam hari.' },
  { answer: 'PENGUIN', category: 'hewan', hint: 'Burung yang tidak bisa terbang dan pandai berenang.' },
  { answer: 'RENDANG', category: 'makanan', hint: 'Masakan daging berbumbu khas Sumatera Barat.' },
  { answer: 'SUSHI', category: 'makanan', hint: 'Hidangan Jepang yang sering menggunakan nasi dan ikan.' },
  { answer: 'PEMPEK', category: 'makanan', hint: 'Makanan khas Palembang yang biasa disajikan dengan cuko.' },
  { answer: 'GADO GADO', category: 'makanan', hint: 'Hidangan sayuran Indonesia dengan saus kacang.' },
  { answer: 'BULU TANGKIS', category: 'olahraga', hint: 'Olahraga raket yang menggunakan kok.' },
  { answer: 'BASKET', category: 'olahraga', hint: 'Olahraga tim yang memasukkan bola ke dalam ring.' },
  { answer: 'MARATON', category: 'olahraga', hint: 'Lomba lari jarak jauh sejauh 42,195 kilometer.' },
  { answer: 'SEPAK BOLA', category: 'olahraga', hint: 'Permainan dua tim yang umumnya berusaha mencetak gol.' },
  { answer: 'PROKLAMASI', category: 'sejarah', hint: 'Pernyataan kemerdekaan Indonesia pada 17 Agustus 1945.' },
  { answer: 'BOROBUDUR', category: 'sejarah', hint: 'Candi Buddha besar yang berada di Magelang.' },
  { answer: 'KARTINI', category: 'sejarah', hint: 'Tokoh emansipasi perempuan Indonesia yang diperingati setiap April.' },
  { answer: 'PIRAMIDA', category: 'sejarah', hint: 'Bangunan monumental yang identik dengan Mesir kuno.' },
  { answer: 'JAM', category: 'logika', hint: 'Memiliki jarum tetapi tidak bisa menjahit.' },
  { answer: 'BAYANGAN', category: 'logika', hint: 'Selalu mengikuti bentukmu saat ada cahaya, tetapi tidak bisa disentuh.' },
  { answer: 'TELUR', category: 'logika', hint: 'Punya cangkang, tetapi bukan rumah.' },
  { answer: 'PETA', category: 'logika', hint: 'Memiliki banyak kota dan jalan, tetapi tidak memiliki penduduk atau kendaraan.' },
  { answer: 'PELANGI', category: 'umum', hint: 'Fenomena warna-warni yang dapat terlihat setelah hujan.' },
  { answer: 'KALENDER', category: 'umum', hint: 'Digunakan untuk mengetahui tanggal, bulan, dan tahun.' },
  { answer: 'INDONESIA', category: 'umum', hint: 'Negara kepulauan yang memiliki semboyan Bhinneka Tunggal Ika.' },
  { answer: 'DELAPAN', category: 'umum', hint: 'Angka yang jika ditidurkan menyerupai simbol tak terhingga.' },
];

export function normalizeGuessAnswer(value = '') {
  return String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toUpperCase().replace(/[^A-Z0-9]/g, '');
}


export function classifyGuessDifficulty(question) {
  const length = normalizeGuessAnswer(question?.answer || '').length;
  return length <= 6 ? 'mudah' : length <= 10 ? 'sedang' : 'sulit';
}
