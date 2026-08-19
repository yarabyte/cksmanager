import React from 'react'
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { capitalizeFirstLetter, formatCurrency, formatFactureNumero } from '@/lib/formatting'
import type { EncaissementRecuDetail } from '@/lib/types/caisse'

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 9, fontFamily: 'Helvetica' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#000', paddingBottom: 8 },
  title: { fontSize: 11, fontWeight: 'bold' },
  section: { marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  tableHeader: { flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#000', paddingVertical: 4, marginTop: 8, fontWeight: 'bold' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#ccc', paddingVertical: 3 },
  colDesignation: { width: '34%' },
  colQty: { width: '8%', textAlign: 'center' },
  colPu: { width: '14%', textAlign: 'right' },
  colTaux: { width: '8%', textAlign: 'center' },
  colPatient: { width: '18%', textAlign: 'right' },
  colAssurance: { width: '18%', textAlign: 'right' },
  totals: { marginTop: 12, alignSelf: 'flex-end', width: 180 },
  footer: { marginTop: 24, textAlign: 'center', fontSize: 9 },
})

function formatCategorie(nom: string | null | undefined): string {
  return capitalizeFirstLetter(nom ?? '')
}

function formatDateFr(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function RecuPdfDocument({ recu }: { recu: EncaissementRecuDetail }) {
  const clinique = recu.clinique

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{(clinique.nomClinique ?? 'CLINIQUE').toUpperCase()}</Text>
            {clinique.adresse ? <Text>{clinique.adresse}</Text> : null}
            <Text>
              {[clinique.telephone, clinique.email].filter(Boolean).join(' · ')}
            </Text>
          </View>
          <View>
            <Text style={{ fontWeight: 'bold' }}>REÇU DE CAISSE</Text>
            <Text>{recu.numero}</Text>
            <Text>{formatDateFr(recu.createdAt)}</Text>
            {recu.caissierNom ? <Text>Caissier : {recu.caissierNom}</Text> : null}
          </View>
        </View>

        <View style={styles.section}>
          <Text>
            Patient : {recu.patientLabel ?? `#${recu.patientId}`}
          </Text>
          {recu.medecinNom ? <Text>Médecin : {recu.medecinNom}</Text> : null}
          {recu.type === 'FEUILLE' && recu.feuilleNumero ? (
            <Text>Feuille : {recu.feuilleNumero}</Text>
          ) : null}
          {recu.type === 'FACTURE' && recu.factureNumero ? (
            <Text>Facture : {formatFactureNumero(recu.factureNumero)}</Text>
          ) : null}
          {recu.type === 'PRESCRIPTION' && recu.prescriptionNumero ? (
            <Text>Prescription : {recu.prescriptionNumero}</Text>
          ) : null}
        </View>

        {recu.feuilles.map((f) => (
          <View key={f.feuilleId}>
            {recu.feuilles.length > 1 ? (
              <Text style={{ fontWeight: 'bold', marginTop: 6 }}>Feuille {f.numero}</Text>
            ) : null}
            <View style={styles.tableHeader}>
              <Text style={styles.colDesignation}>Désignation</Text>
              <Text style={styles.colQty}>Qté</Text>
              <Text style={styles.colPu}>P.U.</Text>
              <Text style={styles.colTaux}>Taux</Text>
              <Text style={styles.colAssurance}>Assurance</Text>
              <Text style={styles.colPatient}>Patient</Text>
            </View>
            {f.lignes.map((l) => (
              <View key={l.id} style={styles.tableRow}>
                <Text style={styles.colDesignation}>
                  {l.typeLigne === 'PHARMA'
                    ? `${l.produitNom ?? 'Produit'}${l.produitDosage ? ` ${l.produitDosage}` : ''}`
                    : (l.acteNom ?? 'Acte')}{' '}
                  — {formatCategorie(l.categorieNom)}
                </Text>
                <Text style={styles.colQty}>{l.quantite}</Text>
                <Text style={styles.colPu}>{formatCurrency(l.valeur)}</Text>
                <Text style={styles.colTaux}>{l.taux}%</Text>
                <Text style={styles.colAssurance}>{formatCurrency(l.montantAssurance)}</Text>
                <Text style={styles.colPatient}>{formatCurrency(l.montantPatient)}</Text>
              </View>
            ))}
          </View>
        ))}

        <View style={styles.totals}>
          <View style={styles.row}>
            <Text>Part assurance</Text>
            <Text>{formatCurrency(recu.montantAssurance)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={{ fontWeight: 'bold' }}>Part patient payée</Text>
            <Text style={{ fontWeight: 'bold' }}>{formatCurrency(recu.montant)}</Text>
          </View>
          <View style={styles.row}>
            <Text>Mode de paiement</Text>
            <Text>Portemonnaie</Text>
          </View>
          <View style={styles.row}>
            <Text>Solde portemonnaie</Text>
            <Text>{formatCurrency(recu.walletSoldeApres)}</Text>
          </View>
        </View>

        <Text style={styles.footer}>Merci de votre confiance</Text>
      </Page>
    </Document>
  )
}
