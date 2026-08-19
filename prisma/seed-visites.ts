/**
 * Seed des motifs (référentiel) et import des 130 visites du dump MySQL.
 * Les motifs IDs 1, 3, 4, 5 sont ceux utilisés dans le dump.
 * Les patient_ids (8007090+) sont stockés sans FK — les patients réels seront importés en phase suivante.
 * Les user_ids et medecin_ids correspondent aux IDs de la table users déjà importée.
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const MOTIFS = [
  { id: 1n, libelle: 'Consultation' },
  { id: 2n, libelle: 'Urgence' },
  { id: 3n, libelle: 'Contrôle' },
  { id: 4n, libelle: 'Bilan' },
  { id: 5n, libelle: 'Consultation spécialisée' },
]

type VisiteRow = {
  id: bigint
  patientId: bigint
  motifId: bigint
  userId: bigint
  medecinId: bigint
  dateVisite: Date
  commentaires: string | null
  createdAt: Date
  updatedAt: Date
}

/** Toutes les visites du dump (statut calculé : TERMINEE pour les historiques) */
const VISITES: VisiteRow[] = [
  { id: 20n, patientId: 8007090n, motifId: 3n, userId: 1n, medecinId: 8n, dateVisite: new Date('2026-02-27T10:09:00'), commentaires: null, createdAt: new Date('2026-02-27T09:09:33'), updatedAt: new Date('2026-02-27T09:09:33') },
  { id: 21n, patientId: 8007091n, motifId: 3n, userId: 1n, medecinId: 8n, dateVisite: new Date('2026-03-14T11:46:00'), commentaires: null, createdAt: new Date('2026-03-14T10:47:38'), updatedAt: new Date('2026-03-14T10:47:38') },
  { id: 27n, patientId: 8007094n, motifId: 1n, userId: 1n, medecinId: 9n, dateVisite: new Date('2026-03-25T09:23:00'), commentaires: null, createdAt: new Date('2026-03-25T08:23:35'), updatedAt: new Date('2026-03-25T08:23:35') },
  { id: 29n, patientId: 8007095n, motifId: 1n, userId: 1n, medecinId: 9n, dateVisite: new Date('2026-03-25T09:30:00'), commentaires: null, createdAt: new Date('2026-03-25T08:30:12'), updatedAt: new Date('2026-03-25T08:30:12') },
  { id: 30n, patientId: 8007096n, motifId: 1n, userId: 1n, medecinId: 9n, dateVisite: new Date('2026-03-25T10:19:00'), commentaires: null, createdAt: new Date('2026-03-25T09:19:59'), updatedAt: new Date('2026-03-25T09:19:59') },
  { id: 31n, patientId: 8007097n, motifId: 1n, userId: 1n, medecinId: 9n, dateVisite: new Date('2026-03-25T10:25:00'), commentaires: null, createdAt: new Date('2026-03-25T09:25:38'), updatedAt: new Date('2026-03-25T09:25:38') },
  { id: 32n, patientId: 8007098n, motifId: 1n, userId: 1n, medecinId: 9n, dateVisite: new Date('2026-03-25T10:48:00'), commentaires: null, createdAt: new Date('2026-03-25T09:48:29'), updatedAt: new Date('2026-03-25T09:48:29') },
  { id: 33n, patientId: 8007099n, motifId: 1n, userId: 1n, medecinId: 9n, dateVisite: new Date('2026-03-25T10:56:00'), commentaires: null, createdAt: new Date('2026-03-25T09:56:47'), updatedAt: new Date('2026-03-25T09:56:47') },
  { id: 34n, patientId: 8007100n, motifId: 1n, userId: 1n, medecinId: 9n, dateVisite: new Date('2026-03-25T11:08:00'), commentaires: null, createdAt: new Date('2026-03-25T10:08:19'), updatedAt: new Date('2026-03-25T10:08:19') },
  { id: 35n, patientId: 8007101n, motifId: 1n, userId: 1n, medecinId: 9n, dateVisite: new Date('2026-03-25T11:47:00'), commentaires: null, createdAt: new Date('2026-03-25T10:47:16'), updatedAt: new Date('2026-03-25T10:47:16') },
  { id: 36n, patientId: 8007102n, motifId: 1n, userId: 1n, medecinId: 9n, dateVisite: new Date('2026-03-25T14:21:00'), commentaires: null, createdAt: new Date('2026-03-25T13:21:45'), updatedAt: new Date('2026-03-25T13:21:45') },
  { id: 37n, patientId: 8007103n, motifId: 1n, userId: 1n, medecinId: 7n, dateVisite: new Date('2026-03-25T15:25:00'), commentaires: null, createdAt: new Date('2026-03-25T14:25:46'), updatedAt: new Date('2026-03-25T14:25:46') },
  { id: 38n, patientId: 8007103n, motifId: 1n, userId: 1n, medecinId: 7n, dateVisite: new Date('2026-03-25T17:14:00'), commentaires: null, createdAt: new Date('2026-03-25T16:14:29'), updatedAt: new Date('2026-03-25T16:14:29') },
  { id: 39n, patientId: 8007104n, motifId: 1n, userId: 1n, medecinId: 10n, dateVisite: new Date('2026-03-26T16:06:00'), commentaires: null, createdAt: new Date('2026-03-26T15:06:22'), updatedAt: new Date('2026-03-26T15:06:22') },
  { id: 40n, patientId: 8007105n, motifId: 1n, userId: 1n, medecinId: 9n, dateVisite: new Date('2026-03-26T17:00:00'), commentaires: null, createdAt: new Date('2026-03-26T16:00:27'), updatedAt: new Date('2026-03-26T16:00:27') },
  { id: 41n, patientId: 8007107n, motifId: 1n, userId: 1n, medecinId: 12n, dateVisite: new Date('2026-04-02T08:29:00'), commentaires: null, createdAt: new Date('2026-04-02T07:30:11'), updatedAt: new Date('2026-04-02T07:30:11') },
  { id: 42n, patientId: 8007108n, motifId: 1n, userId: 1n, medecinId: 9n, dateVisite: new Date('2026-04-02T09:01:00'), commentaires: null, createdAt: new Date('2026-04-02T08:01:24'), updatedAt: new Date('2026-04-02T08:01:24') },
  { id: 43n, patientId: 8007109n, motifId: 1n, userId: 1n, medecinId: 9n, dateVisite: new Date('2026-04-02T09:05:00'), commentaires: null, createdAt: new Date('2026-04-02T08:05:57'), updatedAt: new Date('2026-04-02T08:05:57') },
  { id: 44n, patientId: 8007110n, motifId: 1n, userId: 1n, medecinId: 7n, dateVisite: new Date('2026-04-02T13:23:00'), commentaires: null, createdAt: new Date('2026-04-02T12:23:59'), updatedAt: new Date('2026-04-02T12:23:59') },
  { id: 45n, patientId: 8007098n, motifId: 4n, userId: 17n, medecinId: 9n, dateVisite: new Date('2026-04-07T09:18:00'), commentaires: null, createdAt: new Date('2026-04-07T08:18:52'), updatedAt: new Date('2026-04-07T08:18:52') },
  { id: 46n, patientId: 8007111n, motifId: 1n, userId: 1n, medecinId: 9n, dateVisite: new Date('2026-04-08T09:06:00'), commentaires: null, createdAt: new Date('2026-04-08T08:06:59'), updatedAt: new Date('2026-04-08T08:06:59') },
  { id: 47n, patientId: 8007112n, motifId: 1n, userId: 1n, medecinId: 9n, dateVisite: new Date('2026-04-08T09:31:00'), commentaires: null, createdAt: new Date('2026-04-08T08:32:18'), updatedAt: new Date('2026-04-08T08:32:18') },
  { id: 48n, patientId: 8007113n, motifId: 1n, userId: 1n, medecinId: 9n, dateVisite: new Date('2026-04-08T09:35:00'), commentaires: null, createdAt: new Date('2026-04-08T08:35:56'), updatedAt: new Date('2026-04-08T08:35:56') },
  { id: 49n, patientId: 8007114n, motifId: 1n, userId: 1n, medecinId: 9n, dateVisite: new Date('2026-04-08T09:38:00'), commentaires: null, createdAt: new Date('2026-04-08T08:38:47'), updatedAt: new Date('2026-04-08T08:38:47') },
  { id: 50n, patientId: 8007115n, motifId: 1n, userId: 1n, medecinId: 9n, dateVisite: new Date('2026-04-08T09:41:00'), commentaires: null, createdAt: new Date('2026-04-08T08:41:57'), updatedAt: new Date('2026-04-08T08:41:57') },
  { id: 51n, patientId: 8007116n, motifId: 1n, userId: 1n, medecinId: 9n, dateVisite: new Date('2026-04-08T09:49:00'), commentaires: null, createdAt: new Date('2026-04-08T08:50:21'), updatedAt: new Date('2026-04-08T08:50:21') },
  { id: 52n, patientId: 8007098n, motifId: 4n, userId: 17n, medecinId: 9n, dateVisite: new Date('2026-04-08T13:14:00'), commentaires: null, createdAt: new Date('2026-04-08T12:14:33'), updatedAt: new Date('2026-04-08T12:14:33') },
  { id: 53n, patientId: 8007098n, motifId: 4n, userId: 17n, medecinId: 7n, dateVisite: new Date('2026-04-08T13:37:00'), commentaires: null, createdAt: new Date('2026-04-08T12:38:21'), updatedAt: new Date('2026-04-08T12:38:21') },
  { id: 54n, patientId: 8007117n, motifId: 1n, userId: 1n, medecinId: 9n, dateVisite: new Date('2026-04-08T14:29:00'), commentaires: null, createdAt: new Date('2026-04-08T13:30:07'), updatedAt: new Date('2026-04-08T13:30:07') },
  { id: 55n, patientId: 8007118n, motifId: 1n, userId: 1n, medecinId: 7n, dateVisite: new Date('2026-04-08T16:16:00'), commentaires: null, createdAt: new Date('2026-04-08T15:16:55'), updatedAt: new Date('2026-04-08T15:16:55') },
  { id: 56n, patientId: 8007119n, motifId: 5n, userId: 1n, medecinId: 8n, dateVisite: new Date('2026-04-09T08:56:00'), commentaires: null, createdAt: new Date('2026-04-09T07:59:32'), updatedAt: new Date('2026-04-09T07:59:32') },
  { id: 57n, patientId: 8007119n, motifId: 5n, userId: 1n, medecinId: 8n, dateVisite: new Date('2026-04-09T09:08:00'), commentaires: null, createdAt: new Date('2026-04-09T08:08:45'), updatedAt: new Date('2026-04-09T08:08:45') },
  { id: 58n, patientId: 8007120n, motifId: 4n, userId: 17n, medecinId: 7n, dateVisite: new Date('2026-04-14T14:21:00'), commentaires: null, createdAt: new Date('2026-04-14T13:21:47'), updatedAt: new Date('2026-04-14T13:21:47') },
  { id: 59n, patientId: 8007122n, motifId: 1n, userId: 16n, medecinId: 9n, dateVisite: new Date('2026-04-14T16:12:00'), commentaires: null, createdAt: new Date('2026-04-14T15:12:31'), updatedAt: new Date('2026-04-14T15:12:31') },
  { id: 60n, patientId: 8007123n, motifId: 4n, userId: 16n, medecinId: 9n, dateVisite: new Date('2026-04-14T16:21:00'), commentaires: null, createdAt: new Date('2026-04-14T15:22:06'), updatedAt: new Date('2026-04-14T15:22:06') },
  { id: 61n, patientId: 8007124n, motifId: 1n, userId: 16n, medecinId: 9n, dateVisite: new Date('2026-04-15T08:42:00'), commentaires: null, createdAt: new Date('2026-04-15T07:42:38'), updatedAt: new Date('2026-04-15T07:42:38') },
  { id: 62n, patientId: 8007125n, motifId: 1n, userId: 16n, medecinId: 9n, dateVisite: new Date('2026-04-15T09:25:00'), commentaires: null, createdAt: new Date('2026-04-15T08:26:20'), updatedAt: new Date('2026-04-15T08:26:20') },
  { id: 63n, patientId: 8007125n, motifId: 1n, userId: 16n, medecinId: 7n, dateVisite: new Date('2026-04-15T09:26:00'), commentaires: null, createdAt: new Date('2026-04-15T08:27:01'), updatedAt: new Date('2026-04-15T08:27:01') },
  { id: 64n, patientId: 8007126n, motifId: 1n, userId: 16n, medecinId: 9n, dateVisite: new Date('2026-04-15T09:53:00'), commentaires: null, createdAt: new Date('2026-04-15T08:53:52'), updatedAt: new Date('2026-04-15T08:53:52') },
  { id: 65n, patientId: 8007127n, motifId: 1n, userId: 16n, medecinId: 9n, dateVisite: new Date('2026-04-15T10:14:00'), commentaires: null, createdAt: new Date('2026-04-15T09:15:15'), updatedAt: new Date('2026-04-15T09:15:15') },
  { id: 66n, patientId: 8007128n, motifId: 1n, userId: 16n, medecinId: 9n, dateVisite: new Date('2026-04-15T10:18:00'), commentaires: null, createdAt: new Date('2026-04-15T09:18:56'), updatedAt: new Date('2026-04-15T09:18:56') },
  { id: 67n, patientId: 8007129n, motifId: 1n, userId: 16n, medecinId: 9n, dateVisite: new Date('2026-04-15T10:35:00'), commentaires: null, createdAt: new Date('2026-04-15T09:36:14'), updatedAt: new Date('2026-04-15T09:36:14') },
  { id: 68n, patientId: 8007130n, motifId: 1n, userId: 16n, medecinId: 9n, dateVisite: new Date('2026-04-15T10:43:00'), commentaires: null, createdAt: new Date('2026-04-15T09:44:57'), updatedAt: new Date('2026-04-15T09:44:57') },
  { id: 69n, patientId: 8007130n, motifId: 1n, userId: 16n, medecinId: 9n, dateVisite: new Date('2026-04-15T10:43:00'), commentaires: null, createdAt: new Date('2026-04-15T09:44:59'), updatedAt: new Date('2026-04-15T09:44:59') },
  { id: 70n, patientId: 8007131n, motifId: 1n, userId: 16n, medecinId: 9n, dateVisite: new Date('2026-04-15T10:53:00'), commentaires: null, createdAt: new Date('2026-04-15T09:53:47'), updatedAt: new Date('2026-04-15T09:53:47') },
  { id: 71n, patientId: 8007132n, motifId: 1n, userId: 1n, medecinId: 9n, dateVisite: new Date('2026-04-15T11:55:00'), commentaires: null, createdAt: new Date('2026-04-15T10:55:59'), updatedAt: new Date('2026-04-15T10:55:59') },
  { id: 72n, patientId: 8007133n, motifId: 1n, userId: 16n, medecinId: 9n, dateVisite: new Date('2026-04-15T12:03:00'), commentaires: null, createdAt: new Date('2026-04-15T11:03:49'), updatedAt: new Date('2026-04-15T11:03:49') },
  { id: 73n, patientId: 8007134n, motifId: 1n, userId: 1n, medecinId: 9n, dateVisite: new Date('2026-04-15T12:25:00'), commentaires: null, createdAt: new Date('2026-04-15T11:25:39'), updatedAt: new Date('2026-04-15T11:25:39') },
  { id: 74n, patientId: 8007135n, motifId: 1n, userId: 1n, medecinId: 9n, dateVisite: new Date('2026-04-15T12:44:00'), commentaires: null, createdAt: new Date('2026-04-15T11:44:56'), updatedAt: new Date('2026-04-15T11:44:56') },
  { id: 75n, patientId: 8007136n, motifId: 1n, userId: 1n, medecinId: 9n, dateVisite: new Date('2026-04-15T12:54:00'), commentaires: null, createdAt: new Date('2026-04-15T11:54:32'), updatedAt: new Date('2026-04-15T11:54:32') },
  { id: 76n, patientId: 8007137n, motifId: 1n, userId: 1n, medecinId: 9n, dateVisite: new Date('2026-04-15T14:26:00'), commentaires: null, createdAt: new Date('2026-04-15T13:27:10'), updatedAt: new Date('2026-04-15T13:27:10') },
  { id: 78n, patientId: 8007139n, motifId: 1n, userId: 1n, medecinId: 9n, dateVisite: new Date('2026-04-16T08:48:00'), commentaires: null, createdAt: new Date('2026-04-16T07:48:32'), updatedAt: new Date('2026-04-16T07:48:32') },
  { id: 79n, patientId: 8007140n, motifId: 1n, userId: 1n, medecinId: 9n, dateVisite: new Date('2026-04-16T08:51:00'), commentaires: null, createdAt: new Date('2026-04-16T07:51:37'), updatedAt: new Date('2026-04-16T07:51:37') },
  { id: 80n, patientId: 8007141n, motifId: 1n, userId: 1n, medecinId: 9n, dateVisite: new Date('2026-04-16T09:26:00'), commentaires: null, createdAt: new Date('2026-04-16T08:26:45'), updatedAt: new Date('2026-04-16T08:26:45') },
  { id: 81n, patientId: 8007141n, motifId: 1n, userId: 1n, medecinId: 9n, dateVisite: new Date('2026-04-16T09:27:00'), commentaires: null, createdAt: new Date('2026-04-16T08:27:41'), updatedAt: new Date('2026-04-16T08:27:41') },
  { id: 82n, patientId: 8007142n, motifId: 1n, userId: 1n, medecinId: 9n, dateVisite: new Date('2026-04-16T09:31:00'), commentaires: null, createdAt: new Date('2026-04-16T08:32:20'), updatedAt: new Date('2026-04-16T08:32:20') },
  { id: 84n, patientId: 8007144n, motifId: 4n, userId: 1n, medecinId: 9n, dateVisite: new Date('2026-04-20T13:08:00'), commentaires: null, createdAt: new Date('2026-04-20T12:08:58'), updatedAt: new Date('2026-04-20T12:08:58') },
  { id: 85n, patientId: 8007145n, motifId: 1n, userId: 1n, medecinId: 9n, dateVisite: new Date('2026-04-20T15:40:00'), commentaires: null, createdAt: new Date('2026-04-20T14:40:45'), updatedAt: new Date('2026-04-20T14:40:45') },
  { id: 86n, patientId: 8007146n, motifId: 1n, userId: 1n, medecinId: 9n, dateVisite: new Date('2026-04-20T16:23:00'), commentaires: null, createdAt: new Date('2026-04-20T15:23:25'), updatedAt: new Date('2026-04-20T15:23:25') },
  { id: 87n, patientId: 8007147n, motifId: 1n, userId: 1n, medecinId: 7n, dateVisite: new Date('2026-04-21T10:17:00'), commentaires: null, createdAt: new Date('2026-04-21T09:18:08'), updatedAt: new Date('2026-04-21T09:18:08') },
  { id: 88n, patientId: 8007148n, motifId: 1n, userId: 1n, medecinId: 7n, dateVisite: new Date('2026-04-21T10:20:00'), commentaires: null, createdAt: new Date('2026-04-21T09:20:26'), updatedAt: new Date('2026-04-21T09:20:26') },
  { id: 89n, patientId: 8007147n, motifId: 5n, userId: 1n, medecinId: 7n, dateVisite: new Date('2026-04-21T10:51:00'), commentaires: null, createdAt: new Date('2026-04-21T09:52:19'), updatedAt: new Date('2026-04-21T09:52:19') },
  { id: 90n, patientId: 8007149n, motifId: 1n, userId: 1n, medecinId: 9n, dateVisite: new Date('2026-04-21T16:01:00'), commentaires: null, createdAt: new Date('2026-04-21T15:02:07'), updatedAt: new Date('2026-04-21T15:02:07') },
  { id: 91n, patientId: 8007150n, motifId: 1n, userId: 1n, medecinId: 9n, dateVisite: new Date('2026-04-21T16:59:00'), commentaires: null, createdAt: new Date('2026-04-21T15:59:33'), updatedAt: new Date('2026-04-21T15:59:33') },
  { id: 92n, patientId: 8007151n, motifId: 1n, userId: 1n, medecinId: 9n, dateVisite: new Date('2026-04-22T08:19:00'), commentaires: null, createdAt: new Date('2026-04-22T07:19:53'), updatedAt: new Date('2026-04-22T07:19:53') },
  { id: 93n, patientId: 8007152n, motifId: 1n, userId: 1n, medecinId: 9n, dateVisite: new Date('2026-04-22T10:01:00'), commentaires: null, createdAt: new Date('2026-04-22T09:01:20'), updatedAt: new Date('2026-04-22T09:01:20') },
  { id: 94n, patientId: 8007153n, motifId: 1n, userId: 1n, medecinId: 9n, dateVisite: new Date('2026-04-22T10:21:00'), commentaires: null, createdAt: new Date('2026-04-22T09:22:09'), updatedAt: new Date('2026-04-22T09:22:09') },
  { id: 95n, patientId: 8007154n, motifId: 1n, userId: 1n, medecinId: 9n, dateVisite: new Date('2026-04-22T11:01:00'), commentaires: null, createdAt: new Date('2026-04-22T10:01:55'), updatedAt: new Date('2026-04-22T10:01:55') },
  { id: 96n, patientId: 8007155n, motifId: 5n, userId: 1n, medecinId: 8n, dateVisite: new Date('2026-04-22T12:19:00'), commentaires: null, createdAt: new Date('2026-04-22T11:19:29'), updatedAt: new Date('2026-04-22T11:19:29') },
  { id: 97n, patientId: 8007156n, motifId: 1n, userId: 1n, medecinId: 9n, dateVisite: new Date('2026-04-22T13:39:00'), commentaires: null, createdAt: new Date('2026-04-22T12:39:37'), updatedAt: new Date('2026-04-22T12:39:37') },
  { id: 98n, patientId: 8007157n, motifId: 1n, userId: 1n, medecinId: 7n, dateVisite: new Date('2026-04-22T14:51:00'), commentaires: null, createdAt: new Date('2026-04-22T13:51:57'), updatedAt: new Date('2026-04-22T13:51:57') },
  { id: 99n, patientId: 8007158n, motifId: 1n, userId: 1n, medecinId: 9n, dateVisite: new Date('2026-04-23T08:33:00'), commentaires: null, createdAt: new Date('2026-04-23T07:33:29'), updatedAt: new Date('2026-04-23T07:33:29') },
  { id: 100n, patientId: 8007159n, motifId: 5n, userId: 1n, medecinId: 8n, dateVisite: new Date('2026-04-23T08:54:00'), commentaires: null, createdAt: new Date('2026-04-23T07:54:52'), updatedAt: new Date('2026-04-23T07:54:52') },
  { id: 101n, patientId: 8007160n, motifId: 1n, userId: 16n, medecinId: 7n, dateVisite: new Date('2026-04-23T09:50:00'), commentaires: null, createdAt: new Date('2026-04-23T08:51:13'), updatedAt: new Date('2026-04-23T08:51:13') },
  { id: 102n, patientId: 8007160n, motifId: 1n, userId: 1n, medecinId: 7n, dateVisite: new Date('2026-04-23T09:52:00'), commentaires: null, createdAt: new Date('2026-04-23T08:52:25'), updatedAt: new Date('2026-04-23T08:52:25') },
  { id: 103n, patientId: 8007161n, motifId: 1n, userId: 1n, medecinId: 9n, dateVisite: new Date('2026-04-23T10:46:00'), commentaires: null, createdAt: new Date('2026-04-23T09:46:28'), updatedAt: new Date('2026-04-23T09:46:28') },
  { id: 104n, patientId: 8007162n, motifId: 1n, userId: 1n, medecinId: 9n, dateVisite: new Date('2026-04-23T11:10:00'), commentaires: null, createdAt: new Date('2026-04-23T10:10:52'), updatedAt: new Date('2026-04-23T10:10:52') },
  { id: 105n, patientId: 8007163n, motifId: 1n, userId: 1n, medecinId: 9n, dateVisite: new Date('2026-04-23T13:27:00'), commentaires: null, createdAt: new Date('2026-04-23T12:28:08'), updatedAt: new Date('2026-04-23T12:28:08') },
  { id: 106n, patientId: 8007164n, motifId: 1n, userId: 1n, medecinId: 9n, dateVisite: new Date('2026-04-23T13:31:00'), commentaires: null, createdAt: new Date('2026-04-23T12:31:40'), updatedAt: new Date('2026-04-23T12:31:40') },
  { id: 107n, patientId: 8007166n, motifId: 1n, userId: 1n, medecinId: 9n, dateVisite: new Date('2026-04-23T13:34:00'), commentaires: null, createdAt: new Date('2026-04-23T12:34:50'), updatedAt: new Date('2026-04-23T12:34:50') },
  { id: 108n, patientId: 8007167n, motifId: 1n, userId: 1n, medecinId: 9n, dateVisite: new Date('2026-04-23T13:41:00'), commentaires: null, createdAt: new Date('2026-04-23T12:41:57'), updatedAt: new Date('2026-04-23T12:41:57') },
  { id: 109n, patientId: 8007168n, motifId: 1n, userId: 16n, medecinId: 7n, dateVisite: new Date('2026-04-23T15:33:00'), commentaires: null, createdAt: new Date('2026-04-23T14:33:27'), updatedAt: new Date('2026-04-23T14:33:27') },
  { id: 111n, patientId: 8007170n, motifId: 1n, userId: 1n, medecinId: 9n, dateVisite: new Date('2026-04-24T08:28:00'), commentaires: null, createdAt: new Date('2026-04-24T07:28:31'), updatedAt: new Date('2026-04-24T07:28:31') },
  { id: 113n, patientId: 8007171n, motifId: 5n, userId: 1n, medecinId: 8n, dateVisite: new Date('2026-04-24T08:39:00'), commentaires: null, createdAt: new Date('2026-04-24T07:40:17'), updatedAt: new Date('2026-04-24T07:40:17') },
  { id: 114n, patientId: 8007172n, motifId: 5n, userId: 1n, medecinId: 8n, dateVisite: new Date('2026-04-24T09:17:00'), commentaires: null, createdAt: new Date('2026-04-24T08:18:11'), updatedAt: new Date('2026-04-24T08:18:11') },
  { id: 115n, patientId: 8007173n, motifId: 1n, userId: 1n, medecinId: 7n, dateVisite: new Date('2026-04-24T09:21:00'), commentaires: null, createdAt: new Date('2026-04-24T08:22:15'), updatedAt: new Date('2026-04-24T08:22:15') },
  { id: 116n, patientId: 8007172n, motifId: 5n, userId: 1n, medecinId: 8n, dateVisite: new Date('2026-04-24T09:23:00'), commentaires: null, createdAt: new Date('2026-04-24T08:23:35'), updatedAt: new Date('2026-04-24T08:23:35') },
  { id: 120n, patientId: 8007175n, motifId: 1n, userId: 1n, medecinId: 9n, dateVisite: new Date('2026-04-24T09:55:00'), commentaires: null, createdAt: new Date('2026-04-24T08:55:40'), updatedAt: new Date('2026-04-24T08:55:40') },
  { id: 121n, patientId: 8007173n, motifId: 1n, userId: 17n, medecinId: 9n, dateVisite: new Date('2026-04-24T09:57:00'), commentaires: null, createdAt: new Date('2026-04-24T08:57:55'), updatedAt: new Date('2026-04-24T08:57:55') },
  { id: 122n, patientId: 8007173n, motifId: 4n, userId: 17n, medecinId: 9n, dateVisite: new Date('2026-04-24T09:59:00'), commentaires: null, createdAt: new Date('2026-04-24T08:59:12'), updatedAt: new Date('2026-04-24T08:59:12') },
  { id: 123n, patientId: 8007173n, motifId: 4n, userId: 17n, medecinId: 9n, dateVisite: new Date('2026-04-24T10:00:00'), commentaires: null, createdAt: new Date('2026-04-24T09:00:48'), updatedAt: new Date('2026-04-24T09:00:48') },
  { id: 124n, patientId: 8007175n, motifId: 1n, userId: 1n, medecinId: 9n, dateVisite: new Date('2026-04-24T10:03:00'), commentaires: null, createdAt: new Date('2026-04-24T09:03:34'), updatedAt: new Date('2026-04-24T09:03:34') },
  { id: 125n, patientId: 8007175n, motifId: 1n, userId: 1n, medecinId: 9n, dateVisite: new Date('2026-04-24T10:06:00'), commentaires: null, createdAt: new Date('2026-04-24T09:06:58'), updatedAt: new Date('2026-04-24T09:06:58') },
  { id: 126n, patientId: 8007173n, motifId: 1n, userId: 17n, medecinId: 9n, dateVisite: new Date('2026-04-24T10:06:00'), commentaires: null, createdAt: new Date('2026-04-24T09:07:10'), updatedAt: new Date('2026-04-24T09:07:10') },
  { id: 127n, patientId: 8007173n, motifId: 4n, userId: 17n, medecinId: 9n, dateVisite: new Date('2026-04-24T10:09:00'), commentaires: null, createdAt: new Date('2026-04-24T09:09:33'), updatedAt: new Date('2026-04-24T09:09:33') },
  { id: 128n, patientId: 8007175n, motifId: 1n, userId: 1n, medecinId: 9n, dateVisite: new Date('2026-04-24T10:10:00'), commentaires: null, createdAt: new Date('2026-04-24T09:10:54'), updatedAt: new Date('2026-04-24T09:10:54') },
  { id: 129n, patientId: 8007175n, motifId: 4n, userId: 17n, medecinId: 9n, dateVisite: new Date('2026-04-24T10:11:00'), commentaires: null, createdAt: new Date('2026-04-24T09:12:14'), updatedAt: new Date('2026-04-24T09:12:14') },
  { id: 130n, patientId: 8007176n, motifId: 1n, userId: 1n, medecinId: 9n, dateVisite: new Date('2026-04-24T10:53:00'), commentaires: null, createdAt: new Date('2026-04-24T09:53:30'), updatedAt: new Date('2026-04-24T09:53:30') },
  { id: 131n, patientId: 8007177n, motifId: 1n, userId: 1n, medecinId: 9n, dateVisite: new Date('2026-04-24T12:13:00'), commentaires: null, createdAt: new Date('2026-04-24T11:13:56'), updatedAt: new Date('2026-04-24T11:13:56') },
  { id: 132n, patientId: 8007178n, motifId: 1n, userId: 1n, medecinId: 7n, dateVisite: new Date('2026-04-24T12:36:00'), commentaires: null, createdAt: new Date('2026-04-24T11:37:13'), updatedAt: new Date('2026-04-24T11:37:13') },
  { id: 133n, patientId: 8007178n, motifId: 5n, userId: 1n, medecinId: 7n, dateVisite: new Date('2026-04-24T13:35:00'), commentaires: null, createdAt: new Date('2026-04-24T12:35:25'), updatedAt: new Date('2026-04-24T12:35:25') },
  { id: 134n, patientId: 8007179n, motifId: 1n, userId: 1n, medecinId: 7n, dateVisite: new Date('2026-04-24T16:47:00'), commentaires: null, createdAt: new Date('2026-04-24T15:47:56'), updatedAt: new Date('2026-04-24T15:47:56') },
  { id: 135n, patientId: 8007180n, motifId: 4n, userId: 17n, medecinId: 7n, dateVisite: new Date('2026-04-24T17:06:00'), commentaires: null, createdAt: new Date('2026-04-24T16:07:08'), updatedAt: new Date('2026-04-24T16:07:08') },
  { id: 136n, patientId: 8007182n, motifId: 1n, userId: 1n, medecinId: 14n, dateVisite: new Date('2026-04-25T10:51:00'), commentaires: null, createdAt: new Date('2026-04-25T09:51:45'), updatedAt: new Date('2026-04-25T09:51:45') },
  { id: 137n, patientId: 8007183n, motifId: 1n, userId: 1n, medecinId: 9n, dateVisite: new Date('2026-04-25T11:06:00'), commentaires: null, createdAt: new Date('2026-04-25T10:06:28'), updatedAt: new Date('2026-04-25T10:06:28') },
  { id: 138n, patientId: 8007184n, motifId: 1n, userId: 1n, medecinId: 14n, dateVisite: new Date('2026-04-25T11:48:00'), commentaires: null, createdAt: new Date('2026-04-25T10:48:57'), updatedAt: new Date('2026-04-25T10:48:57') },
  { id: 139n, patientId: 8007185n, motifId: 4n, userId: 1n, medecinId: 9n, dateVisite: new Date('2026-04-25T12:21:00'), commentaires: null, createdAt: new Date('2026-04-25T11:21:39'), updatedAt: new Date('2026-04-25T11:21:39') },
  { id: 140n, patientId: 8007186n, motifId: 1n, userId: 1n, medecinId: 9n, dateVisite: new Date('2026-04-25T13:27:00'), commentaires: null, createdAt: new Date('2026-04-25T12:27:34'), updatedAt: new Date('2026-04-25T12:27:34') },
  { id: 141n, patientId: 8007187n, motifId: 1n, userId: 1n, medecinId: 9n, dateVisite: new Date('2026-04-25T13:29:00'), commentaires: null, createdAt: new Date('2026-04-25T12:30:08'), updatedAt: new Date('2026-04-25T12:30:08') },
  { id: 142n, patientId: 8007188n, motifId: 5n, userId: 1n, medecinId: 8n, dateVisite: new Date('2026-04-27T08:52:00'), commentaires: null, createdAt: new Date('2026-04-27T07:52:57'), updatedAt: new Date('2026-04-27T07:52:57') },
  { id: 143n, patientId: 8007188n, motifId: 5n, userId: 1n, medecinId: 8n, dateVisite: new Date('2026-04-27T08:56:00'), commentaires: null, createdAt: new Date('2026-04-27T07:56:48'), updatedAt: new Date('2026-04-27T07:56:48') },
  { id: 144n, patientId: 8007189n, motifId: 1n, userId: 1n, medecinId: 7n, dateVisite: new Date('2026-04-27T09:52:00'), commentaires: null, createdAt: new Date('2026-04-27T08:52:29'), updatedAt: new Date('2026-04-27T08:52:29') },
  { id: 145n, patientId: 8007190n, motifId: 1n, userId: 1n, medecinId: 7n, dateVisite: new Date('2026-04-27T11:09:00'), commentaires: null, createdAt: new Date('2026-04-27T10:09:35'), updatedAt: new Date('2026-04-27T10:09:35') },
  { id: 146n, patientId: 8007191n, motifId: 5n, userId: 16n, medecinId: 8n, dateVisite: new Date('2026-04-27T11:41:00'), commentaires: null, createdAt: new Date('2026-04-27T10:41:18'), updatedAt: new Date('2026-04-27T10:41:18') },
  { id: 147n, patientId: 8007192n, motifId: 1n, userId: 1n, medecinId: 9n, dateVisite: new Date('2026-04-27T14:52:00'), commentaires: null, createdAt: new Date('2026-04-27T13:52:36'), updatedAt: new Date('2026-04-27T13:52:36') },
  { id: 148n, patientId: 8007193n, motifId: 5n, userId: 1n, medecinId: 8n, dateVisite: new Date('2026-04-27T15:20:00'), commentaires: null, createdAt: new Date('2026-04-27T14:21:12'), updatedAt: new Date('2026-04-27T14:21:12') },
  { id: 149n, patientId: 8007193n, motifId: 1n, userId: 16n, medecinId: 8n, dateVisite: new Date('2026-04-27T15:28:00'), commentaires: null, createdAt: new Date('2026-04-27T14:28:50'), updatedAt: new Date('2026-04-27T14:28:50') },
  { id: 150n, patientId: 8007195n, motifId: 1n, userId: 16n, medecinId: 9n, dateVisite: new Date('2026-04-27T15:32:00'), commentaires: null, createdAt: new Date('2026-04-27T14:32:35'), updatedAt: new Date('2026-04-27T14:32:35') },
  { id: 151n, patientId: 8007196n, motifId: 1n, userId: 16n, medecinId: 9n, dateVisite: new Date('2026-04-27T16:21:00'), commentaires: null, createdAt: new Date('2026-04-27T15:21:43'), updatedAt: new Date('2026-04-27T15:21:43') },
]

/** Calcule le statut selon la date de visite (heuristique : journée d'aujourd'hui = EN_COURS) */
function computeStatut(dateVisite: Date): string {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const d = new Date(dateVisite.getFullYear(), dateVisite.getMonth(), dateVisite.getDate())
  if (d.getTime() === today.getTime()) return 'EN_COURS'
  return 'TERMINEE'
}

async function main() {
  // Motifs
  for (const m of MOTIFS) {
    await prisma.motif.upsert({
      where: { id: m.id },
      create: { id: m.id, libelle: m.libelle },
      update: { libelle: m.libelle },
    })
  }
  console.log(`Motifs : ${MOTIFS.length} upserted`)

  // Visites
  let count = 0
  for (const v of VISITES) {
    await prisma.visite.upsert({
      where: { id: v.id },
      create: {
        id: v.id,
        patientId: v.patientId,
        motifId: v.motifId,
        userId: v.userId,
        medecinId: v.medecinId,
        dateVisite: v.dateVisite,
        commentaires: v.commentaires,
        statut: computeStatut(v.dateVisite),
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
      },
      update: {
        patientId: v.patientId,
        motifId: v.motifId,
        userId: v.userId,
        medecinId: v.medecinId,
        dateVisite: v.dateVisite,
        commentaires: v.commentaires,
        statut: computeStatut(v.dateVisite),
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
      },
    })
    count++
  }
  console.log(`Visites : ${count} upserted`)
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
