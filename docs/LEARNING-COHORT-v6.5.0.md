# Learning Cohort v6.5.0

Learning Cohort adalah kelompok belajar desain yang berjalan di satu grup WhatsApp. Cohort bukan kelas berbayar, sertifikasi, atau peringkat publik.

## Siklus program

1. Admin grup/Owner membuat program dengan durasi 1–12 minggu.
2. Anggota membaca detail lalu bergabung secara sukarela.
3. Creator/Admin menambahkan fasilitator; fasilitator menyusun maksimal 12 milestone.
4. Fasilitator memulai cohort.
5. Peserta mengirim check-in untuk milestone yang masih terbuka.
6. Fasilitator meninjau check-in sebagai `approved` atau `revision`.
7. Peserta melihat progress pribadinya; fasilitator/Admin dapat melihat ringkasan agregat.
8. Program ditutup otomatis saat melewati tanggal akhir ketika daftar cohort diperiksa, atau ditutup manual.

## Command reference

```text
.cohort help
.cohort buat Dasar Branding | Belajar identitas visual secara bertahap. | 4
.cohort list
.cohort detail KODE
.cohort join KODE
.cohort leave KODE
.cohort fasilitator tambah KODE @anggota
.cohort fasilitator hapus KODE @anggota
.cohort milestone tambah KODE | Brief Visual | Buat tiga alternatif arah visual. | 7
.cohort milestone list KODE
.cohort mulai KODE
.cohort checkin KODE M01 | Saya membuat tiga alternatif komposisi. | https://tautan-karya
.cohort progress KODE
.cohort ringkasan KODE
.cohort kiriman KODE
.cohort review KODE-CHECKIN approve | Hierarki dan kontras sudah jelas.
.cohort review KODE-CHECKIN revisi | Tambahkan alasan pemilihan palet dan uji kontras.
.cohort tutup KODE
.cohort batal KODE
.cohort hapusdata KODE konfirmasi
.cohort hapus KODE konfirmasi
```

## Permission model

- Create: group Admin or bot Owner.
- Cancel: cohort creator, group Admin, or bot Owner.
- Facilitator management: creator, group Admin, or Owner.
- Milestone/start/close/review: facilitator, group Admin, or Owner.
- Join/leave/check-in: the requesting member.
- Personal progress: participant only.
- Aggregate progress and check-in queue: facilitator, group Admin, or Owner.
- Personal data deletion: the participant, with explicit confirmation.
- Full cohort deletion: creator, group Admin, or Owner, with explicit confirmation.

## Limits and data model

- 50 participants, five facilitators, 12 milestones, and three open/active cohorts per group.
- One check-in per participant per milestone, enforced by a unique compound index.
- Work links must use HTTPS; links are not fetched by the cohort feature.
- Cohort and check-in queries always include `groupJid`.
- Participant progress shows only their own check-ins. Facilitator summary aggregates counts and does not rank or list participants.
- `.cohort hapusdata` removes the participant's check-ins and membership. `.cohort hapus` deletes the cohort and its check-ins after confirmation.
- Cross-document deletion is best-effort on standalone MongoDB; if cleanup fails after the cohort record is removed, the command reports that check-in cleanup remains pending. Use a backup before production operations.

## Staging checklist

- Test on two different WhatsApp groups and verify codes cannot cross group boundaries.
- Test creator, Admin, facilitator, participant, and unrelated member permissions.
- Test join capacity, duplicate join, duplicate milestone check-in, review updates, and program closure.
- Test personal data deletion and full cohort deletion against a staging database backup.
- Test LID/PN mention normalization with the target Baileys version.
