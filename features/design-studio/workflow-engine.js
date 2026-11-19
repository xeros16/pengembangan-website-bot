// Designer Workflow 2.0 — project pipeline helpers.
// Pure functions: no database or WhatsApp I/O, so stage transitions are deterministic and testable.

export const DESIGN_WORKFLOW_STAGES = Object.freeze([
  {
    id: 'brief',
    label: 'Brief',
    goal: 'Pastikan tujuan, audiens, pesan utama, output, dan batasan proyek jelas.',
    checklist: [
      'Tujuan dan hasil yang diharapkan sudah disepakati.',
      'Audiens utama dan kebutuhan mereka sudah ditentukan.',
      'Platform, ukuran, konten wajib, dan batasan sudah dicatat.',
    ],
    commands: (project, prefix) => [
      `${prefix}wizard — susun brief lengkap langkah demi langkah`,
      `${prefix}designproject edit ${project.name} | ${project.kind} | ${project.theme} | ${project.audience} | ${project.platform}`,
    ],
  },
  {
    id: 'concept',
    label: 'Konsep',
    goal: 'Pilih arah kreatif yang menjawab brief, bukan sekadar gaya yang terlihat menarik.',
    checklist: [
      'Minimal satu arah konsep dipilih dan alasannya dicatat.',
      'Mood, kata kunci visual, dan referensi sudah disepakati.',
      'Konsep tidak meniru karya atau identitas pihak lain.',
    ],
    commands: (project, prefix) => [
      `${prefix}creative ${project.theme} | ${project.palette || 'gaya yang sesuai brief'} | ${project.platform}`,
      `${prefix}moodboard ${project.theme} ${project.palette || ''}`.trim(),
      `${prefix}designprompt ${project.theme}`,
    ],
  },
  {
    id: 'layout',
    label: 'Layout',
    goal: 'Tentukan struktur, grid, urutan informasi, dan komposisi sebelum memoles detail visual.',
    checklist: [
      'Focal point dan hierarki informasi sudah ditentukan.',
      'Grid, alignment, margin, dan ruang kosong sudah diperiksa.',
      'Layout diuji pada ukuran atau perangkat target.',
    ],
    commands: (project, prefix) => {
      const layoutKind = project.kind === 'sosial' ? 'feed'
        : ['web', 'app', 'bot', 'marketplace'].includes(project.kind) ? 'web'
          : ['poster', 'kemasan'].includes(project.kind) ? 'poster' : '';
      return [
        ...(layoutKind ? [`${prefix}layoutstudio ${layoutKind}`] : []),
        ...(project.kind === 'sosial' ? [`${prefix}socialkit instagram_feed`] : []),
        `${prefix}creative ${project.theme} | komposisi dan hierarki | ${project.platform}`,
      ];
    },
  },
  {
    id: 'visual',
    label: 'Visual system',
    goal: 'Kunci warna, tipografi, dan aturan visual agar semua elemen terasa konsisten.',
    checklist: [
      'Palet memiliki peran warna yang jelas dan kontras diperiksa.',
      'Pasangan font dan hierarki teks sudah ditentukan.',
      'Token atau aturan visual dapat diterapkan secara konsisten.',
    ],
    commands: (project, prefix) => {
      const knownPalettes = new Set(['minimalis', 'futuristik', 'elegan', 'alam', 'retro', 'pastel', 'ocean', 'sunset', 'earthy', 'candy', 'monokrom', 'botanical', 'lavender', 'coffee', 'sakura']);
      const palette = knownPalettes.has(project.palette) || /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(project.palette)
        ? project.palette : 'minimalis';
      const moods = ['elegan', 'modern', 'playful', 'futuristik', 'editorial', 'bold'];
      const fontMood = moods.includes(project.font) ? project.font
        : /premium|lux|elegan|beauty|fashion/i.test(`${project.theme} ${project.font}`) ? 'elegan'
          : /futur|tech|digital|game/i.test(`${project.theme} ${project.font}`) ? 'futuristik'
            : /retro|festival|musik|editorial/i.test(`${project.theme} ${project.font}`) ? 'editorial'
              : /ceria|playful|anak|edukasi/i.test(`${project.theme} ${project.font}`) ? 'playful' : 'modern';
      const fontKind = project.kind === 'sosial' ? 'feed'
        : ['web', 'app', 'bot', 'marketplace'].includes(project.kind) ? 'web'
          : ['poster', 'logo', 'kemasan'].includes(project.kind) ? 'poster' : 'feed';
      return [
        `${prefix}colorpalette ${palette}`,
        ...(knownPalettes.has(palette) ? [`${prefix}palettekit ${palette}`] : []),
        `${prefix}fontstudio ${fontMood} ${fontKind}`,
        `${prefix}typescale 16 1.25 5`,
      ];
    },
  },
  {
    id: 'qa',
    label: 'QA & revisi',
    goal: 'Periksa kualitas, keterbacaan, konsistensi, spesifikasi teknis, dan hak penggunaan aset.',
    checklist: [
      'Checklist sesuai jenis output telah diperiksa.',
      'Kontras, ejaan, ukuran, crop/safe area, dan resolusi telah diuji.',
      'Font, gambar, dan aset memiliki izin penggunaan yang sesuai.',
      'Temuan penting sudah diperbaiki atau dicatat untuk revisi.',
    ],
    commands: (project, prefix) => {
      const qaKind = ['poster', 'logo', 'sosial', 'web', 'app', 'kemasan'].includes(project.kind) ? project.kind : 'poster';
      return [
        `${prefix}designqa ${qaKind}`,
        `${prefix}qareview ${qaKind}`,
        `${prefix}designscore ${qaKind} | <nilai 0–2 untuk setiap kriteria>`,
      ];
    },
  },
  {
    id: 'handoff',
    label: 'Handoff',
    goal: 'Serahkan file, spesifikasi, sumber aset, lisensi, versi, dan persetujuan dengan jelas.',
    checklist: [
      'File master dan file final sudah disiapkan serta dibuka ulang.',
      'Ukuran, format, warna, font, dan aset yang diserahkan sudah dicatat.',
      'Lisensi, batas penggunaan, PIC, versi, dan persetujuan akhir sudah jelas.',
    ],
    commands: (project, prefix) => [
      `${prefix}handoff ${project.name} | ${project.kind} | ${project.platform} | PNG, SVG, PDF | ${project.palette || 'cantumkan kode warna'} | ${project.font || 'cantumkan font dan lisensi'}`,
      `${prefix}designproject export ${project.name}`,
    ],
  },
]);

const STAGE_IDS = new Set(DESIGN_WORKFLOW_STAGES.map(stage => stage.id));
const clean = (value, max = 120) => String(value ?? '')
  .replace(/[\r\n\u0000-\u001f]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, max);

export function createDesignWorkflowState(timestamp = new Date().toISOString()) {
  return { currentStage: 'brief', completedStages: [], updatedAt: timestamp };
}

export function normalizeDesignWorkflow(project = {}) {
  const source = project?.workflow && typeof project.workflow === 'object' ? project.workflow : {};
  const requested = Array.isArray(source.completedStages) ? new Set(source.completedStages) : new Set();
  const completedStages = [];
  for (const stage of DESIGN_WORKFLOW_STAGES) {
    if (!requested.has(stage.id)) break;
    completedStages.push(stage.id);
  }
  const currentStage = completedStages.length === DESIGN_WORKFLOW_STAGES.length
    ? 'complete'
    : DESIGN_WORKFLOW_STAGES[completedStages.length].id;
  return {
    currentStage,
    completedStages,
    updatedAt: typeof source.updatedAt === 'string' ? source.updatedAt : '',
  };
}

export function getDesignWorkflowProgress(project = {}) {
  const workflow = normalizeDesignWorkflow(project);
  const total = DESIGN_WORKFLOW_STAGES.length;
  const completed = workflow.completedStages.length;
  return {
    ...workflow,
    total,
    completed,
    percent: Math.round((completed / total) * 100),
    current: DESIGN_WORKFLOW_STAGES.find(stage => stage.id === workflow.currentStage) || null,
  };
}

export function completeDesignWorkflowStage(project = {}, requestedStage = '') {
  const progress = getDesignWorkflowProgress(project);
  if (!progress.current) return { ok: false, reason: 'already_complete', progress };
  const stageId = clean(requestedStage, 30).toLowerCase();
  if (stageId && stageId !== progress.current.id) {
    return { ok: false, reason: 'not_current_stage', expected: progress.current.id, progress };
  }
  const completedStages = [...progress.completedStages, progress.current.id];
  const nextStage = DESIGN_WORKFLOW_STAGES[completedStages.length]?.id || 'complete';
  const workflow = { currentStage: nextStage, completedStages, updatedAt: new Date().toISOString() };
  return {
    ok: true,
    stage: progress.current,
    nextStage,
    project: { ...project, workflow },
    progress: getDesignWorkflowProgress({ ...project, workflow }),
  };
}

export function reopenDesignWorkflowStage(project = {}, stageId = '') {
  const id = clean(stageId, 30).toLowerCase();
  const index = DESIGN_WORKFLOW_STAGES.findIndex(stage => stage.id === id);
  if (index < 0) return { ok: false, reason: 'unknown_stage' };
  const progress = getDesignWorkflowProgress(project);
  if (!progress.completedStages.includes(id)) return { ok: false, reason: 'not_completed', stage: DESIGN_WORKFLOW_STAGES[index] };
  const completedStages = progress.completedStages.slice(0, index);
  const workflow = { currentStage: id, completedStages, updatedAt: new Date().toISOString() };
  return {
    ok: true,
    stage: DESIGN_WORKFLOW_STAGES[index],
    project: { ...project, workflow },
    progress: getDesignWorkflowProgress({ ...project, workflow }),
  };
}

export function getDesignWorkflowStage(stageId) {
  return DESIGN_WORKFLOW_STAGES.find(stage => stage.id === stageId) || null;
}

export function formatDesignWorkflowProgress(project = {}, prefix = '.') {
  const progress = getDesignWorkflowProgress(project);
  const barLength = 6;
  const bar = '●'.repeat(progress.completed) + '○'.repeat(barLength - progress.completed);
  const rows = DESIGN_WORKFLOW_STAGES.map((stage, index) => {
    const done = progress.completedStages.includes(stage.id);
    const current = progress.currentStage === stage.id;
    return `${done ? '✅' : current ? '➡️' : '○'} ${index + 1}. ${stage.label}${current ? ' — *sedang dikerjakan*' : ''}`;
  });
  const next = progress.current
    ? `\n\n*Langkah berikutnya:* ${prefix}designproject step ${project.name}`
    : '\n\n🎉 Semua tahap workflow sudah ditandai selesai. Pastikan file final dan persetujuan sudah tersimpan.';
  return `📊 *PROGRESS PROYEK — ${clean(project.name, 70)}*\n${bar} *${progress.percent}%* (${progress.completed}/${progress.total} tahap)\n\n${rows.join('\n')}${next}`;
}

export function formatDesignWorkflowStep(project = {}, prefix = '.') {
  const progress = getDesignWorkflowProgress(project);
  if (!progress.current) {
    return `🎉 *WORKFLOW SELESAI — ${clean(project.name, 70)}*\nSemua enam tahap sudah ditandai selesai.\n\nLihat ringkasan: ${prefix}designproject show ${project.name}\nExport brief: ${prefix}designproject export ${project.name}`;
  }
  const stage = progress.current;
  const safeProject = {
    name: clean(project.name),
    kind: clean(project.kind),
    theme: clean(project.theme),
    audience: clean(project.audience),
    platform: clean(project.platform),
    palette: clean(project.palette),
    font: clean(project.font),
  };
  const commands = stage.commands(safeProject, prefix);
  return `🧭 *LANGKAH ${progress.completed + 1}/${progress.total} — ${stage.label.toUpperCase()}*\nProyek: *${safeProject.name}* (${safeProject.kind})\nTema: ${safeProject.theme || 'Belum ditentukan'}\nAudiens: ${safeProject.audience || 'Belum ditentukan'}\nOutput: ${safeProject.platform || 'Belum ditentukan'}\n\n*Tujuan tahap ini*\n${stage.goal}\n\n*Checklist sebelum lanjut*\n${stage.checklist.map(item => `□ ${item}`).join('\n')}\n\n*Tools yang bisa digunakan*\n${commands.map(command => `• ${command}`).join('\n')}\n\nJika tahap ini sudah kamu selesaikan, konfirmasi dengan:\n${prefix}designproject done ${safeProject.name}\n\nProgress: ${prefix}designproject progress ${safeProject.name}`;
}

export function buildDesignWorkflowSummary(project = {}, prefix = '.') {
  const progress = getDesignWorkflowProgress(project);
  return `${formatDesignWorkflowProgress(project, prefix)}\n\n*Brief proyek*\nJenis: ${clean(project.kind) || '-'}\nTema: ${clean(project.theme) || '-'}\nAudiens: ${clean(project.audience) || '-'}\nOutput: ${clean(project.platform) || '-'}\nPalet: ${clean(project.palette) || 'Belum ditentukan'}\nTipografi: ${clean(project.font) || 'Belum ditentukan'}\n\n*Kontrol workflow*\n• Lihat langkah aktif: ${prefix}designproject step ${clean(project.name)}\n• Tandai tahap selesai: ${prefix}designproject done ${clean(project.name)}\n• Buka ulang tahap: ${prefix}designproject reopen ${clean(project.name)} | <brief|concept|layout|visual|qa|handoff>\n• Export ringkasan: ${prefix}designproject export ${clean(project.name)}`;
}
