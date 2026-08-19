"use client"

import * as React from "react"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Package,
  Pill,
  Boxes,
  Truck,
  ChevronRight,
  Sparkles,
  Loader2,
} from "lucide-react"
import { usePharmacieStats } from "@/hooks/use-pharmacie"
import { cn } from "@/lib/utils"

const cardSurface =
  "rounded-2xl border border-gray-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-all duration-200 ease-in-out"

function KpiStat({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType
  label: string
  value: React.ReactNode
  color: string
}) {
  return (
    <div
      className={cn(
        cardSurface,
        "px-5 py-4 flex items-center justify-between gap-4 hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)]",
      )}
    >
      <div>
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
          {label}
        </p>
        <p className="text-[26px] font-extrabold leading-none tracking-tight text-gray-800 tabular-nums">
          {value}
        </p>
      </div>
      <div
        className="h-11 w-11 rounded-2xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}18` }}
      >
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
    </div>
  )
}

const hubs = [
  {
    title: "Conditionnements",
    desc: "Emballages (boîte, flacon, blister…)",
    href: "/configuration/pharmacie/conditionnements",
    icon: Boxes,
    accent: "#cd3b86",
  },
  {
    title: "Formes galéniques",
    desc: "Comprimé, sirop, solution injectable…",
    href: "/configuration/pharmacie/formes-galeniques",
    icon: Pill,
    accent: "#58a639",
  },
  {
    title: "Fournisseurs",
    desc: "Distributeurs et grossistes",
    href: "/configuration/pharmacie/fournisseurs",
    icon: Truck,
    accent: "#d97706",
  },
  {
    title: "Produits",
    desc: "Catalogue médicaments et DM",
    href: "/configuration/pharmacie/produits",
    icon: Package,
    accent: "#525252",
  },
] as const

export default function PharmacieConfigHubPage() {
  const { data: stats, isLoading, error, refetch, isFetching } = usePharmacieStats()

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold text-[#cd3b86] uppercase tracking-widest mb-2">
            Configuration
          </p>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight font-['DM_Sans',sans-serif]">
            Pharmacie
          </h1>
          <p className="text-gray-500 mt-2 max-w-xl text-[15px]">
            Référentiels et catalogue produits — alignés sur la facturation et les
            conventions assureurs.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xl border-gray-200 shrink-0"
          onClick={() => void refetch()}
          disabled={isFetching}
        >
          {isFetching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          <span className="ml-2">Actualiser</span>
        </Button>
      </div>

      {error && (
        <div
          className={cn(
            cardSurface,
            "px-4 py-3 text-sm text-red-700 bg-red-50/80 border-red-100",
          )}
        >
          {error instanceof Error ? error.message : "Erreur de chargement"}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiStat
          icon={Boxes}
          label="Conditionnements"
          value={isLoading ? "—" : (stats?.conditionnements ?? 0)}
          color="#cd3b86"
        />
        <KpiStat
          icon={Pill}
          label="Formes galéniques"
          value={isLoading ? "—" : (stats?.formesGaleniques ?? 0)}
          color="#58a639"
        />
        <KpiStat
          icon={Truck}
          label="Fournisseurs"
          value={isLoading ? "—" : (stats?.fournisseurs ?? 0)}
          color="#d97706"
        />
        <KpiStat
          icon={Package}
          label="Produits actifs"
          value={isLoading ? "—" : `${stats?.produitsActifs ?? 0} / ${stats?.produits ?? 0}`}
          color="#525252"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {hubs.map((h) => (
          <Link key={h.href} href={h.href} className="group block">
            <Card
              className={cn(
                cardSurface,
                "h-full overflow-hidden border-gray-100 hover:border-[#cd3b8633] hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)]",
              )}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div
                    className="h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-200 ease-in-out group-hover:scale-105"
                    style={{ backgroundColor: `${h.accent}14` }}
                  >
                    <h.icon className="h-6 w-6" style={{ color: h.accent }} />
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-[#cd3b86] transition-colors" />
                </div>
                <CardTitle className="text-lg font-bold text-gray-900 mt-3 font-['DM_Sans',sans-serif]">
                  {h.title}
                </CardTitle>
                <CardDescription className="text-gray-500 text-sm leading-relaxed">
                  {h.desc}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 pb-5">
                <span className="text-sm font-semibold text-[#cd3b86] group-hover:underline">
                  Ouvrir
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
