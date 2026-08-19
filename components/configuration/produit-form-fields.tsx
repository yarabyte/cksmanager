"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  produitSitePharmaLabels,
  produitSitePharmaValues,
  type ProduitSitePharma,
} from "@/lib/validations/pharmacie"
import { cn } from "@/lib/utils"

export type ProduitFormState = {
  nom: string
  principeActif: string
  codeCip: string
  formeGaleniqueId: string
  dosage: string
  conditionnementId: string
  qteParConditionnement: number
  prixAchatRef: string
  prixVenteRef: string
  hnc: string
  qteAlerte: number
  assureurId: string
  sitePharma: ProduitSitePharma
  actif: boolean
}

type RefRow = { id: string; libelle: string }

const fieldInput =
  "rounded-xl h-10 bg-gray-50/90 border-gray-200 focus-visible:bg-white transition-colors"
const fieldSelect = "rounded-xl h-10 bg-gray-50/90 border-gray-200 w-full"

function FormSection({
  title,
  children,
  className,
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn("space-y-3", className)}>
      <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#cd3b86]">
        {title}
      </h3>
      <div className="rounded-xl border border-gray-100 bg-white p-4 space-y-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
        {children}
      </div>
    </section>
  )
}

function Field({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string
  htmlFor?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor} className="text-xs font-medium text-gray-600">
        {label}
      </Label>
      {children}
    </div>
  )
}

export function ProduitFormFields({
  form,
  setForm,
  formes,
  conditionnements,
  assurances,
  idPrefix = "p",
}: {
  form: ProduitFormState
  setForm: React.Dispatch<React.SetStateAction<ProduitFormState>>
  formes: RefRow[]
  conditionnements: RefRow[]
  assurances: { id: string; nom: string }[]
  idPrefix?: string
}) {
  const id = (name: string) => `${idPrefix}-${name}`

  return (
    <div className="space-y-5">
      <FormSection title="Identification">
        <Field label="Nom commercial" htmlFor={id("nom")}>
          <Input
            id={id("nom")}
            className={fieldInput}
            value={form.nom}
            onChange={(e) => setForm((s) => ({ ...s, nom: e.target.value }))}
          />
        </Field>
        <Field label="Principe actif" htmlFor={id("pa")}>
          <Input
            id={id("pa")}
            className={fieldInput}
            value={form.principeActif}
            onChange={(e) => setForm((s) => ({ ...s, principeActif: e.target.value }))}
          />
        </Field>
      </FormSection>

      <FormSection title="Présentation">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Forme galénique">
            <Select
              value={form.formeGaleniqueId}
              onValueChange={(v) => setForm((s) => ({ ...s, formeGaleniqueId: v }))}
            >
              <SelectTrigger className={fieldSelect}>
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent className="rounded-xl max-h-56">
                {formes.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.libelle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Conditionnement">
            <Select
              value={form.conditionnementId}
              onValueChange={(v) => setForm((s) => ({ ...s, conditionnementId: v }))}
            >
              <SelectTrigger className={fieldSelect}>
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent className="rounded-xl max-h-56">
                {conditionnements.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.libelle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Field label="Dosage / présentation" htmlFor={id("dos")}>
          <Input
            id={id("dos")}
            className={fieldInput}
            value={form.dosage}
            onChange={(e) => setForm((s) => ({ ...s, dosage: e.target.value }))}
          />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Code CIP" htmlFor={id("cip")}>
            <Input
              id={id("cip")}
              className={cn(fieldInput, "font-sans text-sm")}
              value={form.codeCip}
              onChange={(e) => setForm((s) => ({ ...s, codeCip: e.target.value }))}
            />
          </Field>
          <Field label="Qté / conditionnement" htmlFor={id("qte")}>
            <Input
              id={id("qte")}
              type="number"
              min={0}
              className={fieldInput}
              value={form.qteParConditionnement}
              onChange={(e) =>
                setForm((s) => ({
                  ...s,
                  qteParConditionnement: Number.parseInt(e.target.value, 10) || 0,
                }))
              }
            />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Tarification">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Prix achat ref." htmlFor={id("achat")}>
            <Input
              id={id("achat")}
              className={cn(fieldInput, "tabular-nums")}
              value={form.prixAchatRef}
              onChange={(e) => setForm((s) => ({ ...s, prixAchatRef: e.target.value }))}
            />
          </Field>
          <Field label="Prix vente ref." htmlFor={id("vente")}>
            <Input
              id={id("vente")}
              className={cn(fieldInput, "tabular-nums")}
              value={form.prixVenteRef}
              onChange={(e) => setForm((s) => ({ ...s, prixVenteRef: e.target.value }))}
            />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="HNC (optionnel)" htmlFor={id("hnc")}>
            <Input
              id={id("hnc")}
              className={cn(fieldInput, "tabular-nums")}
              value={form.hnc}
              onChange={(e) => setForm((s) => ({ ...s, hnc: e.target.value }))}
            />
          </Field>
          <Field label="Qté alerte rupture" htmlFor={id("alerte")}>
            <Input
              id={id("alerte")}
              type="number"
              min={0}
              className={fieldInput}
              value={form.qteAlerte}
              onChange={(e) =>
                setForm((s) => ({
                  ...s,
                  qteAlerte: Number.parseInt(e.target.value, 10) || 0,
                }))
              }
            />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Rattachements">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Répartition">
            <Select
              value={form.sitePharma}
              onValueChange={(v) =>
                setForm((s) => ({ ...s, sitePharma: v as ProduitSitePharma }))
              }
            >
              <SelectTrigger className={fieldSelect}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {produitSitePharmaValues.map((v) => (
                  <SelectItem key={v} value={v}>
                    {produitSitePharmaLabels[v]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Convention assureur">
            <Select
              value={form.assureurId || "none"}
              onValueChange={(v) =>
                setForm((s) => ({ ...s, assureurId: v === "none" ? "" : v }))
              }
            >
              <SelectTrigger className={fieldSelect}>
                <SelectValue placeholder="Aucune" />
              </SelectTrigger>
              <SelectContent className="rounded-xl max-h-56">
                <SelectItem value="none">Aucune</SelectItem>
                {assurances.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3">
          <div>
            <Label htmlFor={id("actif")} className="text-sm font-medium text-gray-800">
              Actif au catalogue
            </Label>
            <p className="text-xs text-gray-500 mt-0.5">Visible dans les prescriptions et kits</p>
          </div>
          <Switch
            id={id("actif")}
            checked={form.actif}
            onCheckedChange={(v) => setForm((s) => ({ ...s, actif: v }))}
          />
        </div>
      </FormSection>
    </div>
  )
}
