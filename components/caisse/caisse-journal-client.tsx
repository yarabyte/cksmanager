"use client"

import * as React from "react"
import Link from "next/link"
import { CalendarRange, Filter, Loader2, Printer } from "lucide-react"
import { getJournalCaisseJour } from "@/app/actions/caisse"
import { CaisseJournalCard } from "@/components/caisse/caisse-journal-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DatePickerFr } from "@/components/ui/date-picker-fr"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  buildJournalPrintUrl,
  getJournalPeriodeLabel,
  JOURNAL_PERIODE_OPTIONS,
} from "@/lib/caisse/journal-labels"
import type { JournalCaisseFilters, JournalCaisseJour } from "@/lib/types/caisse"

const PERIODE_OPTIONS = JOURNAL_PERIODE_OPTIONS

export function CaisseJournalClient({
  sessionId,
  initialJournal,
  posteNom,
}: {
  sessionId: string
  initialJournal: JournalCaisseJour
  posteNom: string
}) {
  const [periode, setPeriode] = React.useState(initialJournal.periode ?? "today")
  const [customDateFrom, setCustomDateFrom] = React.useState("")
  const [customDateTo, setCustomDateTo] = React.useState("")
  const [appliedDateFrom, setAppliedDateFrom] = React.useState("")
  const [appliedDateTo, setAppliedDateTo] = React.useState("")
  const [journal, setJournal] = React.useState(initialJournal)
  const [loading, setLoading] = React.useState(false)

  async function loadJournal(filters: JournalCaisseFilters) {
    setLoading(true)
    try {
      const data = await getJournalCaisseJour(sessionId, filters)
      setJournal(data)
    } finally {
      setLoading(false)
    }
  }

  function handlePeriodeChange(value: string) {
    setPeriode(value)
    if (value !== "custom") {
      void loadJournal({ periode: value })
    }
  }

  function handleCustomApply() {
    if (!customDateFrom) return
    setAppliedDateFrom(customDateFrom)
    setAppliedDateTo(customDateTo)
    void loadJournal({
      periode: "custom",
      dateFrom: customDateFrom,
      dateTo: customDateTo || customDateFrom,
    })
  }

  const printHref = buildJournalPrintUrl({
    periode,
    dateFrom: periode === "custom" ? appliedDateFrom : undefined,
    dateTo: periode === "custom" ? appliedDateTo || appliedDateFrom : undefined,
  })

  return (
    <div className="space-y-4">
      <Card className="border border-gray-100 shadow-sm">
        <CardContent className="px-4 py-3 space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Filter className="h-3.5 w-3.5" />
                Période
              </div>
              <Select value={periode} onValueChange={handlePeriodeChange} disabled={loading}>
                <SelectTrigger className="h-9 w-[180px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIODE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-9 gap-1.5"
                disabled={loading || (periode === "custom" && !appliedDateFrom)}
              >
                <Link href={printHref} target="_blank">
                  <Printer className="h-3.5 w-3.5" />
                  Imprimer
                </Link>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Poste <strong>{posteNom}</strong>
            </p>
          </div>

          {periode === "custom" && (
            <div className="flex flex-wrap items-end gap-2 rounded-lg border bg-muted/30 p-3">
              <CalendarRange className="mb-2.5 h-4 w-4 text-muted-foreground" />
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">Du</label>
                <DatePickerFr
                  dateValue={customDateFrom}
                  onDateChange={setCustomDateFrom}
                  placeholder="Date de début"
                  clearable={false}
                  className="h-9 w-[180px] text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">Au</label>
                <DatePickerFr
                  dateValue={customDateTo}
                  onDateChange={setCustomDateTo}
                  placeholder="Date de fin"
                  clearable={false}
                  min={customDateFrom || undefined}
                  className="h-9 w-[180px] text-xs"
                />
              </div>
              <Button
                size="sm"
                className="h-9 bg-[#cd3b86] hover:bg-[#b8307a] text-white"
                disabled={!customDateFrom || loading}
                onClick={handleCustomApply}
              >
                Appliquer
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <CaisseJournalCard
        journal={journal}
        title={`Journal de caisse — ${getJournalPeriodeLabel(
          periode,
          periode === "custom" ? appliedDateFrom : undefined,
          periode === "custom" ? appliedDateTo : undefined,
        )}`}
      />
    </div>
  )
}
