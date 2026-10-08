"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  acteTypeLabels,
  acteTypeValues,
  normalizeActeType,
  type ActeType,
} from "@/lib/validations/acte"

export type ActeRowLike = {
  id: string
  nom: string
  codeBase?: string | null
  coefficient: number
  valeurFixe?: number | null
  prixHnc?: string | null
  imputeAssurance?: number | null
  typeActe?: string | null
  exonerePartPatient?: boolean
  categorie: { id: string; nom: string }
  assureur?: { id: string; nom: string } | null
}

export type ActeSavePayload = {
  nom: string
  categorieId: string
  assureurId: string | null
  codeBase: string | null
  coefficient: number
  valeurFixe: number | null
  prixHnc: string | null
  imputeAssurance: number | null
  typeActe: ActeType
  exonerePartPatient: boolean
}

type ActeEditDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  initialActe: ActeRowLike | null
  categories: { id: string; nom: string }[]
  assurances: { id: unknown; nom: string }[]
  isPending: boolean
  onSave: (payload: ActeSavePayload) => Promise<void>
}

const emptyForm = {
  nom: "",
  categorieId: "",
  assureurId: "none",
  codeBase: "",
  coefficient: "1",
  valeurFixe: "",
  prixHnc: "",
  imputeAssurance: "",
  typeActe: "CKS",
  exonerePartPatient: false,
}

export function ActeEditDialog({
  open,
  onOpenChange,
  mode,
  initialActe,
  categories,
  assurances,
  isPending,
  onSave,
}: ActeEditDialogProps) {
  const [form, setForm] = React.useState(emptyForm)

  React.useEffect(() => {
    if (!open) return
    if (mode === "create") {
      setForm({
        ...emptyForm,
        categorieId: categories[0]?.id ?? "",
      })
    } else if (initialActe) {
      const r = initialActe
      setForm({
        nom: r.nom,
        categorieId: String(r.categorie.id),
        assureurId: r.assureur ? String(r.assureur.id) : "none",
        codeBase: r.codeBase ?? "",
        coefficient: String(r.coefficient),
        valeurFixe: r.valeurFixe != null ? String(r.valeurFixe) : "",
        prixHnc: r.prixHnc ?? "",
        imputeAssurance:
          r.imputeAssurance != null ? String(r.imputeAssurance) : "",
        typeActe: normalizeActeType(r.typeActe),
        exonerePartPatient: r.exonerePartPatient === true,
      })
    }
  }, [open, mode, initialActe, categories])

  async function handleSubmit() {
    const coef = Number.parseFloat(form.coefficient)
    if (!form.nom.trim() || !form.categorieId || Number.isNaN(coef)) {
      toast.error("Nom, catégorie et coefficient valides requis.")
      return
    }
    const payload: ActeSavePayload = {
      nom: form.nom.trim(),
      categorieId: form.categorieId,
      assureurId:
        form.assureurId === "none" || form.assureurId === ""
          ? null
          : form.assureurId,
      codeBase: form.codeBase.trim() || null,
      coefficient: coef,
      valeurFixe:
        form.valeurFixe.trim() === ""
          ? null
          : Number.parseFloat(form.valeurFixe),
      prixHnc: form.prixHnc.trim() || null,
      imputeAssurance:
        form.imputeAssurance.trim() === ""
          ? null
          : Number.parseInt(form.imputeAssurance, 10),
      typeActe: normalizeActeType(form.typeActe),
      exonerePartPatient: form.exonerePartPatient,
    }
    if (payload.valeurFixe != null && Number.isNaN(payload.valeurFixe)) {
      toast.error("Valeur fixe invalide.")
      return
    }
    if (
      payload.imputeAssurance != null &&
      Number.isNaN(payload.imputeAssurance)
    ) {
      toast.error("Impute assurance invalide.")
      return
    }
    await onSave(payload)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(92vh,820px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[540px] rounded-2xl border-gray-100 shadow-[0_8px_40px_rgba(0,0,0,0.12)]">
        <div className="h-1 w-full shrink-0 bg-gradient-to-r from-[#cd3b86] via-[#e06bb0] to-[#cd3b86]/60" />
        <DialogHeader className="shrink-0 space-y-1 border-b border-gray-100 bg-gradient-to-b from-pink-50/50 to-white px-6 pt-5 pb-4">
          <DialogTitle className="text-lg font-bold text-[#525252]">
            {mode === "edit" ? "Modifier l'acte" : "Nouvel acte"}
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500 leading-relaxed">
            Tarification et rattachement assureur optionnel — aligné sur le référentiel actes.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-auto overflow-y-auto overscroll-contain px-6">
          <div className="space-y-6 py-4 pb-6">
            <section className="space-y-3">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Informations générales
              </h3>
              <div className="space-y-2">
                <Label htmlFor="acte-edit-nom">Libellé</Label>
                <Textarea
                  id="acte-edit-nom"
                  value={form.nom}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, nom: e.target.value }))
                  }
                  placeholder={"Ex. Consultation spécialiste\n(deuxième ligne si besoin)"}
                  rows={4}
                  className="min-h-[100px] resize-y whitespace-pre-wrap"
                />
                <p className="text-xs text-muted-foreground">
                  Saut de ligne autorisé (touche Entrée).
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Catégorie</Label>
                  <Select
                    value={form.categorieId}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, categorieId: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Assureur (optionnel)</Label>
                  <Select
                    value={form.assureurId}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, assureurId: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucun</SelectItem>
                      {assurances.map((a) => (
                        <SelectItem key={String(a.id)} value={String(a.id)}>
                          {a.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Type d&apos;acte</Label>
                <RadioGroup
                  value={normalizeActeType(form.typeActe)}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, typeActe: v as ActeType }))
                  }
                  className="grid grid-cols-2 gap-2"
                >
                  {acteTypeValues.map((value) => {
                    const selected = normalizeActeType(form.typeActe) === value
                    return (
                      <label
                        key={value}
                        htmlFor={`acte-type-${value}`}
                        className={cn(
                          "flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors",
                          selected
                            ? "border-[#cd3b86] bg-[#cd3b86]/5 text-[#cd3b86]"
                            : "border-gray-200 text-gray-700 hover:bg-gray-50",
                        )}
                      >
                        <RadioGroupItem value={value} id={`acte-type-${value}`} />
                        {acteTypeLabels[value]}
                      </label>
                    )
                  })}
                </RadioGroup>
              </div>
              <label
                htmlFor="acte-exonere"
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 px-3 py-2.5"
              >
                <Checkbox
                  id="acte-exonere"
                  checked={form.exonerePartPatient}
                  onCheckedChange={(checked) =>
                    setForm((f) => ({ ...f, exonerePartPatient: checked === true }))
                  }
                  className="mt-0.5"
                />
                <span>
                  <span className="block text-sm font-medium text-gray-800">
                    Exonéré de la part patient
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    Le patient ne paie pas la part hors HNC. Un avoir est créé à la
                    confirmation de la feuille. Le HNC et la part assurance restent dus.
                  </span>
                </span>
              </label>
            </section>

            <Separator />

            <section className="space-y-3">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Tarification & codes
              </h3>
              <div className="space-y-2">
                <Label htmlFor="acte-edit-code">Code base</Label>
                <Input
                  id="acte-edit-code"
                  value={form.codeBase}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, codeBase: e.target.value }))
                  }
                  placeholder="Code conventionnel"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="acte-edit-coef">Coefficient</Label>
                  <Input
                    id="acte-edit-coef"
                    type="number"
                    step="0.01"
                    value={form.coefficient}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, coefficient: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="acte-edit-vf">Valeur fixe</Label>
                  <Input
                    id="acte-edit-vf"
                    type="number"
                    step="0.01"
                    value={form.valeurFixe}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, valeurFixe: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="acte-edit-prix">Prix HNC (FCFA)</Label>
                <Input
                  id="acte-edit-prix"
                  value={form.prixHnc}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, prixHnc: e.target.value }))
                  }
                  placeholder="ex. 15000.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="acte-edit-imp">Impute assurance</Label>
                <Input
                  id="acte-edit-imp"
                  type="number"
                  value={form.imputeAssurance}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      imputeAssurance: e.target.value,
                    }))
                  }
                />
              </div>
            </section>
          </div>
        </div>
        <DialogFooter className="shrink-0 gap-2 border-t border-gray-100 bg-gray-50/50 px-6 py-4 sm:justify-end">
          <Button
            variant="outline"
            type="button"
            className="rounded-xl border-gray-200"
            onClick={() => onOpenChange(false)}
          >
            Annuler
          </Button>
          <Button
            type="button"
            className="rounded-xl bg-[#cd3b86] hover:bg-[#b8307a] text-white shadow-sm"
            onClick={() => void handleSubmit()}
            disabled={isPending}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
