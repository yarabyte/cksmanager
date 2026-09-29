import { formatCurrency } from '@/lib/formatting'

const SECTION_SEP = '───────────────'
const MESSAGE_FOOTER = '_Message automatique — CKS Manager_'

function patientGreeting(patientLabel: string | null, patientId: string): string {
  const name = patientLabel?.trim()
  if (name) return `Bonjour ${name} 👋`
  return 'Bonjour 👋'
}

function formatOperationCount(count: number): string {
  if (count <= 0) return 'aucune opération'
  return count === 1 ? '1 opération' : `${count} opérations`
}

function formatMouvement(montant: number, count: number): string {
  return `${formatCurrency(montant)} · ${formatOperationCount(count)}`
}

function formatHospitalisationCount(count: number): string {
  if (count <= 0) return 'aucune'
  return count === 1 ? '1' : String(count)
}

function formatEcartLine(ecart: number): string {
  const montant = formatCurrency(Math.abs(ecart))
  if (ecart === 0) {
    return '✅ *Écart : 0 FCFA* — caisse conforme'
  }
  if (ecart > 0) {
    return `⚠️ *Écart : +${montant}* — surplus en caisse`
  }
  return `⚠️ *Écart : −${montant}* — manque en caisse`
}

export function walletRechargeMessage(input: {
  patientLabel: string | null
  patientId: string
  clinique: string
  montant: number
  solde: number
}): string {
  return [
    patientGreeting(input.patientLabel, input.patientId),
    '',
    `Votre portefeuille *${input.clinique}* a été rechargé avec succès.`,
    '',
    SECTION_SEP,
    '*Détail de l\'opération*',
    '',
    `➕ Montant crédité : *${formatCurrency(input.montant)}*`,
    `💰 Nouveau solde : *${formatCurrency(input.solde)}*`,
    '',
    'Merci de votre confiance 🙏',
    '',
    MESSAGE_FOOTER,
  ].join('\n')
}

export function encaissementMessage(input: {
  patientLabel: string | null
  patientId: string
  clinique: string
  montant: number
  numero: string
  solde: number
}): string {
  return [
    patientGreeting(input.patientLabel, input.patientId),
    '',
    `Votre paiement à *${input.clinique}* a bien été enregistré.`,
    '',
    SECTION_SEP,
    '*Détail du paiement*',
    '',
    `💳 Montant payé : *${formatCurrency(input.montant)}*`,
    `📄 Reçu n° *${input.numero}*`,
    `💰 Solde portefeuille : *${formatCurrency(input.solde)}*`,
    '',
    '📎 Votre reçu est joint à ce message.',
    '',
    'Merci de votre confiance 🙏',
    '',
    MESSAGE_FOOTER,
  ].join('\n')
}

export function retourPharmacieMessage(input: {
  patientLabel: string | null
  patientId: string
  clinique: string
  numero: string
  montant: number
  solde: number
}): string {
  return [
    patientGreeting(input.patientLabel, input.patientId),
    '',
    `Un avoir a été crédité sur votre portefeuille *${input.clinique}*.`,
    '',
    SECTION_SEP,
    '*Détail du retour pharmacie*',
    '',
    `📦 Retour n° *${input.numero}*`,
    `➕ Avoir crédité : *${formatCurrency(input.montant)}*`,
    `💰 Nouveau solde : *${formatCurrency(input.solde)}*`,
    '',
    'Ce montant est disponible sur votre portefeuille pour vos prochains soins.',
    '',
    MESSAGE_FOOTER,
  ].join('\n')
}

export function caisseClotureRapportMessage(input: {
  clinique: string
  posteNom: string
  caissierNom: string
  openedAt: string
  closedAt: string
  soldeOuverture: number
  totalRecharges: number
  nbRecharges: number
  totalVersements: number
  nbVersements: number
  totalEncaissements: number
  nbEncaissements: number
  nbHospitalisationsJour: number
  soldeTheorique: number
  soldeReel: number
  ecart: number
  commentaireEcart: string | null
}): string {
  const lines = [
    'Bonjour 👋',
    '',
    `La caisse *${input.posteNom}* de *${input.clinique}* vient d'être clôturée.`,
    '',
    '👤 Caissier·ère : ' + input.caissierNom,
    `🕐 Ouverte le ${input.openedAt}`,
    `🕐 Fermée le ${input.closedAt}`,
    '',
    SECTION_SEP,
    '*Mouvements de la session*',
    '',
    `💵 Fonds de départ : ${formatCurrency(input.soldeOuverture)}`,
    `➕ Recharges (espèces / MoMo) : ${formatMouvement(input.totalRecharges, input.nbRecharges)}`,
    `➖ Versements sortants : ${formatMouvement(input.totalVersements, input.nbVersements)}`,
    `✅ Encaissements patients : ${formatMouvement(input.totalEncaissements, input.nbEncaissements)}`,
    `🏥 Hospitalisations du jour : ${formatHospitalisationCount(input.nbHospitalisationsJour)}`,
    '',
    SECTION_SEP,
    '*Bilan de clôture*',
    '',
    `Solde attendu : ${formatCurrency(input.soldeTheorique)}`,
    `Espèces comptées : ${formatCurrency(input.soldeReel)}`,
    formatEcartLine(input.ecart),
  ]

  if (input.commentaireEcart?.trim()) {
    lines.push('', `💬 _Note : ${input.commentaireEcart.trim()}_`)
  }

  lines.push('', MESSAGE_FOOTER)

  return lines.join('\n')
}
