import React from 'react'
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { formatCurrency } from '@/lib/formatting'
import type { AvoirFeuilleDetail } from '@/lib/types/avoir-feuille'

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: 'Helvetica' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingBottom: 10,
  },
  title: { fontSize: 12, fontWeight: 'bold' },
  section: { marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { color: '#555' },
  box: {
    marginTop: 8,
    marginBottom: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  motif: { marginTop: 4, lineHeight: 1.4 },
  footer: { marginTop: 28, textAlign: 'center', fontSize: 9, color: '#666' },
})

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

export function AvoirFeuillePdfDocument({ avoir }: { avoir: AvoirFeuilleDetail }) {
  const clinique = avoir.clinique

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{(clinique.nomClinique ?? 'CLINIQUE').toUpperCase()}</Text>
            {clinique.adresse ? <Text>{clinique.adresse}</Text> : null}
            <Text>{[clinique.telephone, clinique.email].filter(Boolean).join(' · ')}</Text>
          </View>
          <View>
            <Text style={{ fontWeight: 'bold' }}>AVOIR COMPTABLE</Text>
            <Text>{avoir.numero}</Text>
            <Text>{formatDateFr(avoir.createdAt)}</Text>
            <Text>Statut : {avoir.statut === 'ACTIF' ? 'Actif' : 'Annulé'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text>Patient : {avoir.patientLabel ?? `#${avoir.patientId}`}</Text>
          {avoir.medecinNom ? <Text>Médecin : {avoir.medecinNom}</Text> : null}
          <Text>Feuille : {avoir.feuilleNumero}</Text>
          {avoir.dateVisite ? <Text>Visite : {formatDateFr(avoir.dateVisite)}</Text> : null}
        </View>

        <View style={styles.box}>
          <View style={styles.row}>
            <Text style={styles.label}>Part patient feuille</Text>
            <Text>{formatCurrency(avoir.totalPatientFeuille)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Part assurance</Text>
            <Text>{formatCurrency(avoir.totalAssuranceFeuille)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={{ fontWeight: 'bold' }}>Montant avoir</Text>
            <Text style={{ fontWeight: 'bold' }}>{formatCurrency(avoir.montant)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={{ fontWeight: 'bold' }}>Motif</Text>
          <Text style={styles.motif}>{avoir.motif}</Text>
        </View>

        <View style={styles.section}>
          <Text>Créé par : {avoir.userName ?? '—'}</Text>
          {avoir.statut === 'ANNULE' ? (
            <Text>
              Annulé par : {avoir.cancelledByName ?? '—'}
              {avoir.cancelledAt ? ` · ${formatDateFr(avoir.cancelledAt)}` : ''}
            </Text>
          ) : null}
        </View>

        <Text style={styles.footer}>
          Document comptable — annulation de dette patient (sans encaissement)
        </Text>
      </Page>
    </Document>
  )
}
