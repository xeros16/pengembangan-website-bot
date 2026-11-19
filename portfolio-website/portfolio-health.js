function text(value) {
  return String(value || '').trim();
}

export function calculatePortfolioHealth(profile = {}, works = [], services = [], stats = {}) {
  const approved = works.filter(item => item && item.moderationStatus === 'approved');
  const activeServices = services.filter(service => service && service.isActive);
  const caseStudies = approved.filter(item => text(item.challenge) && text(item.solution));
  const approvedWorkCount = Number.isFinite(Number(stats.approvedWorkCount)) ? Math.max(0, Number(stats.approvedWorkCount)) : approved.length;
  const hasCaseStudy = typeof stats.hasCaseStudy === 'boolean' ? stats.hasCaseStudy : caseStudies.length > 0;
  const caseStudyHasOutcome = typeof stats.caseStudyHasOutcome === 'boolean' ? stats.caseStudyHasOutcome : caseStudies.some(item => text(item.outcome));
  const identityFields = [profile.displayName, profile.avatarUrl, profile.bio, profile.location];
  const identityEarned = identityFields.filter(value => text(value)).length * 5;
  const positioningEarned = (text(profile.category) ? 10 : 0) + ((profile.specialties || []).length ? 10 : 0);
  const portfolioEarned = approvedWorkCount >= 3 ? 25 : approvedWorkCount === 2 ? 18 : approvedWorkCount === 1 ? 10 : 0;
  const caseStudyEarned = hasCaseStudy ? (caseStudyHasOutcome ? 15 : 10) : 0;
  const contactEarned = text(profile.contactPhone || profile.publicWhatsApp) ? 10 : 0;
  const serviceEarned = activeServices.length ? 5 : 0;
  const storyEarned = text(profile.tagline) || text(profile.practiceStatement) || text(profile.approach) ? 5 : 0;

  const tasks = [
    { key: 'identity', label: 'Identitas profil', detail: 'Nama, foto, bio, dan lokasi', href: '#edit-profile', earned: identityEarned, points: 20 },
    { key: 'positioning', label: 'Posisi kreatif', detail: 'Kategori utama dan spesialisasi', href: '#edit-profile', earned: positioningEarned, points: 20 },
    { key: 'portfolio', label: 'Karya terpublikasi', detail: 'Target tiga karya yang sudah disetujui', href: '#portfolio-manager', earned: portfolioEarned, points: 25 },
    { key: 'case-study', label: 'Cerita proses proyek', detail: 'Isi tantangan, solusi, dan hasil pada satu karya', href: '#portfolio-manager', earned: caseStudyEarned, points: 15 },
    { key: 'contact', label: 'Kontak langsung', detail: 'Tambahkan kanal kontak publik yang kamu setujui', href: '#edit-profile', earned: contactEarned, points: 10 },
    { key: 'service', label: 'Informasi layanan', detail: 'Aktifkan minimal satu layanan dan kisaran harga', href: '#services-manager', earned: serviceEarned, points: 5 },
    { key: 'story', label: 'Sudut pandang kreatif', detail: 'Tambahkan tagline atau pendekatan kerja', href: '#edit-profile', earned: storyEarned, points: 5 },
  ].map(task => ({ ...task, done: task.earned >= task.points }));

  const score = Math.max(0, Math.min(100, tasks.reduce((total, task) => total + task.earned, 0)));
  const level = score >= 80 ? 'Siap ditemukan' : score >= 55 ? 'Sedang berkembang' : 'Perlu dilengkapi';
  return {
    score,
    level,
    completed: tasks.filter(task => task.done).length,
    totalTasks: tasks.length,
    tasks,
    nextSteps: tasks.filter(task => !task.done).slice(0, 3),
    approvedWorkCount,
    activeServiceCount: activeServices.length,
  };
}
