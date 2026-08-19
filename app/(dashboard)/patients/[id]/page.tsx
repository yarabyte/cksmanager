"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { FactureDbStatusBadge } from "@/components/shared/facture-db-status-badge"
import { VisiteStatutBadge } from "@/components/visites/visite-statut-badge"
import { NouvelleVisiteDialog } from "@/components/visites/nouvelle-visite-dialog"
import {
  ArrowLeft,
  Pencil,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Shield,
  Stethoscope,
  Receipt,
  FileText,
  ScrollText,
  User,
  Wallet,
  Loader2,
} from "lucide-react"
import type { PatientOption } from "@/app/actions/visites"
import {
  formatDate,
  formatDateTime,
  formatCurrency,
  formatFactureNumero,
  calculateAge,
  getInitials,
  formatPatientIdentityLine,
} from "@/lib/formatting"
import { formatWhatsAppPhoneDisplay } from "@/lib/phone"
import { usePatient } from "@/hooks/use-patients"
import { usePatientVisites, useVisiteFormOptions } from "@/hooks/use-visites"
import { PatientAssurancesSection } from "@/components/patients/patient-assurances-section"
import { PatientPortemonnaieSection } from "@/components/patients/patient-portemonnaie-section"
import { PatientFeuillesSection } from "@/components/patients/patient-feuilles-section"
import { usePatientFeuilles } from "@/hooks/use-feuilles-circulation"
import { usePatientFactures } from "@/hooks/use-patient-factures"
import { usePatientWallet } from "@/hooks/use-wallet"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

function PatientInfoSection({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-border/70 bg-white">
      <div className="flex items-center gap-3 border-b border-border/60 bg-gradient-to-r from-[#cd3b86]/[0.06] to-transparent px-6 py-3.5 sm:px-8">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#cd3b86]/10">
          <Icon className="h-4 w-4 text-[#cd3b86]" aria-hidden />
        </span>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <dl className="divide-y divide-border/50">{children}</dl>
    </section>
  )
}

function PatientInfoRow({
  label,
  children,
  valueClassName,
}: {
  label: string
  children: React.ReactNode
  valueClassName?: string
}) {
  return (
    <div className="grid grid-cols-1 gap-1 px-6 py-3.5 sm:grid-cols-[minmax(10rem,34%)_1fr] sm:items-baseline sm:gap-6 sm:px-8">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className={cn("text-sm text-foreground", valueClassName)}>{children}</dd>
    </div>
  )
}

type PatientTab = "visites" | "circulation" | "facturation" | "assurances" | "portemonnaie" | "documents" | "info"

function resolvePatientTab(tab: string | null): PatientTab {
  if (
    tab === "circulation" ||
    tab === "facturation" ||
    tab === "assurances" ||
    tab === "portemonnaie" ||
    tab === "documents" ||
    tab === "info"
  ) {
    return tab
  }
  return "visites"
}

export default function PatientDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const patientId = params.id as string
  const [visiteDialogOpen, setVisiteDialogOpen] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<PatientTab>(() =>
    resolvePatientTab(searchParams.get("tab")),
  )

  React.useEffect(() => {
    setActiveTab(resolvePatientTab(searchParams.get("tab")))
  }, [searchParams])

  const { data: patient, isPending, error } = usePatient(patientId)
  const {
    data: visites = [],
    isPending: visitesPending,
    refetch: refetchVisites,
  } = usePatientVisites(patientId)
  const { data: visiteFormOptions } = useVisiteFormOptions(visiteDialogOpen)
  const walletEnabled = activeTab === "portemonnaie"
  const { data: wallet, isPending: walletPending } = usePatientWallet(patientId, walletEnabled)
  const { data: feuilles = [], isPending: feuillesPending } = usePatientFeuilles(patientId)
  const { data: factures = [], isPending: facturesPending } = usePatientFactures(
    patientId,
    true,
  )
  const createFeuilleHref =
    visites.length > 0
      ? `/feuilles-circulation/nouvelle?visite=${visites[0].id}`
      : null

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Chargement du dossier…</p>
      </div>
    )
  }

  if (error || patient == null) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <p className="text-muted-foreground">Patient non trouvé</p>
        <Button asChild variant="outline">
          <Link href="/patients">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux patients
          </Link>
        </Button>
      </div>
    )
  }

  const patName = String(patient.patName)
  const patSurname = String(patient.patSurname)
  const patDob = String(patient.patDob)
  const patNum1 = String(patient.patNum1)
  const patEmail = patient.patEmail ? String(patient.patEmail) : ""
  const patAdress = String(patient.patAdress)
  const sexe = Number(patient.sexe)
  const nomJeuneFille =
    patient.nomJeuneFille != null && String(patient.nomJeuneFille).trim() !== ""
      ? String(patient.nomJeuneFille)
      : ""
  const createdAt = patient.createdAt ? String(patient.createdAt) : null

  const aps = patient.assurancePatients as
    | { assurance: { nom: string }; tauxCouverture: number }[]
    | undefined
  const primaryAp = aps?.[0]

  const patientForVisite: PatientOption = {
    id: patientId,
    nom: patName,
    prenom: patSurname,
    telephone: patNum1,
    label: formatPatientIdentityLine(patName, patSurname, sexe, nomJeuneFille || null),
  }

  const medecins = visiteFormOptions?.medecins ?? []
  const motifs = visiteFormOptions?.motifs ?? []

  return (
    <div className="space-y-6">
      <NouvelleVisiteDialog
        open={visiteDialogOpen}
        onClose={() => setVisiteDialogOpen(false)}
        medecins={medecins}
        motifs={motifs}
        initialPatient={patientForVisite}
        onCreated={() => {
          void refetchVisites()
        }}
      />
      <Button asChild variant="ghost" size="sm" className="gap-1">
        <Link href="/patients">
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>
      </Button>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-medium">
                  {getInitials(patName, patSurname)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h1 className="text-2xl font-bold">
                  {formatPatientIdentityLine(patName, patSurname, sexe, nomJeuneFille || null)}
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span>{calculateAge(patDob)} ans</span>
                  <span>•</span>
                  <span>{sexe === 1 ? "Homme" : "Femme"}</span>
                  <span>•</span>
                  <span>Né(e) le {formatDate(patDob)}</span>
                </div>
                {primaryAp && (
                  <Badge variant="secondary" className="mt-2 gap-1">
                    <Shield className="h-3 w-3" />
                    {primaryAp.assurance.nom} ({primaryAp.tauxCouverture}%)
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => setVisiteDialogOpen(true)}
              >
                <Stethoscope className="h-4 w-4" />
                Nouvelle visite
              </Button>
              <Button asChild variant="outline" className="gap-2">
                <Link href={`/patients/${patientId}/edit`}>
                  <Pencil className="h-4 w-4" />
                  Modifier
                </Link>
              </Button>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Phone className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Téléphone</p>
                <p className="font-medium tabular-nums">
                  {formatWhatsAppPhoneDisplay(patNum1)}
                </p>
              </div>
            </div>
            {patEmail ? (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium">{patEmail}</p>
                </div>
              </div>
            ) : null}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <MapPin className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Adresse</p>
                <p className="font-medium">{patAdress}</p>
              </div>
            </div>
            {createdAt ? (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Créé le</p>
                  <p className="font-medium">{formatDate(createdAt)}</p>
                </div>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as PatientTab)} className="space-y-4">
        <TabsList className="[&_[data-state=active]]:!bg-primary/10 [&_[data-state=active]]:!text-primary [&_[data-state=active]]:shadow-none">
          <TabsTrigger value="visites" className="gap-2">
            <Stethoscope className="h-4 w-4" />
            Visites
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              {visites.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="circulation" className="gap-2">
            <ScrollText className="h-4 w-4" />
            Feuille de circulation
            {!feuillesPending ? (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {feuilles.length}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="facturation" className="gap-2">
            <Receipt className="h-4 w-4" />
            Facturation
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              {factures.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="assurances" className="gap-2">
            <Shield className="h-4 w-4" />
            Assurances
          </TabsTrigger>
          <TabsTrigger value="portemonnaie" className="gap-2">
            <Wallet className="h-4 w-4" />
            Portemonnaie
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2">
            <FileText className="h-4 w-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="info" className="gap-2">
            <User className="h-4 w-4" />
            Informations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visites">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">
                Historique des visites
              </CardTitle>
              <Button
                type="button"
                size="sm"
                className="gap-2 bg-gradient-to-r from-[#cd3b86] to-[#b8307a] hover:from-[#b8307a] hover:to-[#9b2563] text-white"
                onClick={() => setVisiteDialogOpen(true)}
              >
                <Stethoscope className="h-4 w-4" />
                Nouvelle visite
              </Button>
            </CardHeader>
            <CardContent>
              {visitesPending ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="h-8 w-8 mb-2 animate-spin" />
                  <p>Chargement des visites…</p>
                </div>
              ) : visites.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Stethoscope className="h-8 w-8 mb-2" />
                  <p>Aucune visite enregistrée</p>
                  <Button
                    type="button"
                    size="sm"
                    className="mt-4 gap-2 bg-gradient-to-r from-[#cd3b86] to-[#b8307a] hover:from-[#b8307a] hover:to-[#9b2563] text-white"
                    onClick={() => setVisiteDialogOpen(true)}
                  >
                    <Stethoscope className="h-4 w-4" />
                    Créer une visite
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Motif</TableHead>
                      <TableHead className="hidden sm:table-cell">Médecin</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="hidden md:table-cell">Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visites.map((visite) => (
                      <TableRow key={visite.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell>
                          <Link
                            href={`/visites/${visite.id}`}
                            className="font-medium text-[#cd3b86] hover:underline"
                          >
                            {formatDateTime(visite.dateVisite)}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{visite.motifLibelle}</Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {visite.medecinTitre === "Docteur"
                            ? `Dr. ${visite.medecinNom}`
                            : visite.medecinTitre === "Professeur"
                              ? `Pr. ${visite.medecinNom}`
                              : visite.medecinNom}
                        </TableCell>
                        <TableCell>
                          <VisiteStatutBadge statut={visite.statut} />
                        </TableCell>
                        <TableCell className="hidden md:table-cell max-w-[200px] truncate">
                          {visite.commentaires || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="circulation">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">
                Feuilles de circulation
              </CardTitle>
              {createFeuilleHref ? (
                <Button asChild size="sm" className="gap-2 bg-[#cd3b86] hover:bg-[#b8307a] text-white">
                  <Link href={createFeuilleHref}>
                    <ScrollText className="h-4 w-4" />
                    Nouvelle feuille
                  </Link>
                </Button>
              ) : null}
            </CardHeader>
            <CardContent>
              <PatientFeuillesSection
                feuilles={feuilles}
                isPending={feuillesPending}
                patientId={patientId}
                createHref={createFeuilleHref}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="facturation">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">
                Historique de facturation
              </CardTitle>
            </CardHeader>
            <CardContent>
              {facturesPending ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : factures.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Receipt className="h-8 w-8 mb-2" />
                  <p>Aucune facture enregistrée</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N° Facture</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Feuilles</TableHead>
                      <TableHead>Montant patient</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {factures.map((facture) => (
                      <TableRow key={facture.id}>
                        <TableCell className="font-medium">
                          <Link
                            href={`/facturation/${facture.id}`}
                            className="text-[#cd3b86] hover:underline font-sans text-sm"
                          >
                            {formatFactureNumero(facture.numero)}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {facture.createdAt ? formatDate(facture.createdAt) : "—"}
                        </TableCell>
                        <TableCell>{facture.nbFeuilles}</TableCell>
                        <TableCell>{formatCurrency(facture.montantPatient)}</TableCell>
                        <TableCell>
                          <FactureDbStatusBadge status={facture.statut} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assurances">
          <Card>
            <CardContent className="pt-6">
              <PatientAssurancesSection
                patientId={patientId}
                assurancePatients={patient.assurancePatients}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="portemonnaie">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Portemonnaie patient</CardTitle>
            </CardHeader>
            <CardContent>
              <PatientPortemonnaieSection wallet={wallet} isPending={walletPending} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mb-4" />
              <p className="text-lg font-medium">Aucun document</p>
              <p className="text-sm">Les documents du patient apparaitront ici.</p>
              <Button className="mt-4" variant="outline" disabled>
                Ajouter un document
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="info">
          <div className="space-y-4">
            <div className="flex items-end justify-between gap-3 px-1">
              <div>
                <h2 className="text-base font-semibold tracking-tight text-foreground">
                  Informations complètes
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Identité et coordonnées du dossier patient
                </p>
              </div>
              <Button asChild variant="outline" size="sm" className="shrink-0 gap-1.5 rounded-lg">
                <Link href={`/patients/${patientId}/edit`}>
                  <Pencil className="h-3.5 w-3.5" />
                  Modifier
                </Link>
              </Button>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <PatientInfoSection title="Identité" icon={User}>
                <PatientInfoRow label="Nom complet">
                  <span className="font-medium">
                    {patSurname.toUpperCase()} {patName}
                  </span>
                </PatientInfoRow>
                {sexe === 2 ? (
                  <PatientInfoRow label="Nom de jeune fille">
                    <span className="font-medium">
                      {nomJeuneFille ? nomJeuneFille.toUpperCase() : "—"}
                    </span>
                  </PatientInfoRow>
                ) : null}
                <PatientInfoRow label="Date de naissance" valueClassName="tabular-nums">
                  {formatDate(patDob)}
                </PatientInfoRow>
                <PatientInfoRow label="Lieu de naissance">
                  {String(patient.patLieuNaiss)}
                </PatientInfoRow>
                <PatientInfoRow label="Âge" valueClassName="tabular-nums">
                  {calculateAge(patDob)} ans
                </PatientInfoRow>
                <PatientInfoRow label="Genre">
                  {sexe === 1 ? "Masculin" : "Féminin"}
                </PatientInfoRow>
              </PatientInfoSection>

              <PatientInfoSection title="Coordonnées et profession" icon={MapPin}>
                <PatientInfoRow label="Téléphone" valueClassName="tabular-nums">
                  {formatWhatsAppPhoneDisplay(patNum1)}
                </PatientInfoRow>
                {patient.patNum2 ? (
                  <PatientInfoRow label="Tél. secondaire" valueClassName="tabular-nums">
                    {formatWhatsAppPhoneDisplay(String(patient.patNum2))}
                  </PatientInfoRow>
                ) : null}
                {patEmail ? (
                  <PatientInfoRow label="Email">
                    <span className="break-all">{patEmail}</span>
                  </PatientInfoRow>
                ) : null}
                <PatientInfoRow label="Adresse">
                  <span className="whitespace-pre-wrap">{patAdress}</span>
                </PatientInfoRow>
                {patient.patProfession ? (
                  <PatientInfoRow label="Profession">
                    {String(patient.patProfession)}
                  </PatientInfoRow>
                ) : null}
              </PatientInfoSection>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
