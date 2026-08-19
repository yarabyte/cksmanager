"use client"

import * as React from "react"
import { Check, ChevronsUpDown, X, Search, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useCommandState } from "cmdk"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"

function normalizeForSearch(input: string): string {
  return input
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim()
}

function digitsOnly(input: string): string {
  return input.replace(/\D/g, "")
}

/** Filtre accent-insensible ; score plus élevé = meilleur match (cmdk trie par score). */
export function comboboxCommandFilter(
  value: string,
  search: string,
  keywords?: string[],
): number {
  const q = normalizeForSearch(search)
  if (!q) return 1

  const haystacks = [
    normalizeForSearch(value),
    ...(keywords?.map(normalizeForSearch) ?? []),
    ...(keywords?.map((k) => digitsOnly(normalizeForSearch(k))) ?? []),
  ].filter(Boolean)

  const tokens = q.split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return 1

  let best = 0
  for (const hay of haystacks) {
    if (!hay) continue
    const digitHay = digitsOnly(hay)
    const allMatch = tokens.every((token) => {
      const digitToken = digitsOnly(token)
      return (
        hay.includes(token) ||
        (digitToken.length > 0 && digitHay.includes(digitToken))
      )
    })
    if (!allMatch) continue

    if (hay === q) best = Math.max(best, 1)
    else if (hay.startsWith(q)) best = Math.max(best, 0.95)
    else if (tokens.every((t) => hay.split(/\s+/).some((word) => word.startsWith(t)))) {
      best = Math.max(best, 0.9)
    } else if (tokens.every((t) => hay.includes(t))) {
      best = Math.max(best, 0.75)
    }
  }
  return best
}

function comboboxItemKeywords(opt: ComboboxOption): string[] {
  const parts = [opt.label, opt.description, opt.group, opt.searchText, opt.value].filter(
    Boolean,
  ) as string[]
  return parts
}

function comboboxItemSearchValue(opt: ComboboxOption): string {
  const text = [opt.label, opt.description, opt.searchText, opt.group]
    .filter(Boolean)
    .join(" ")
    .trim()
  return text || opt.value
}

export interface ComboboxOption {
  value: string
  label: string
  description?: string
  /** Termes supplémentaires pour la recherche (ex. assureur, code). */
  searchText?: string
  icon?: React.ReactNode
  disabled?: boolean
  group?: string
}

// ─── Single Select Combobox ───────────────────────────────────────────────────
interface ComboboxProps {
  options: ComboboxOption[]
  value?: string
  onChange?: (value: string | undefined) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  clearable?: boolean
  loading?: boolean
  className?: string
  /** Libellé sélectionné sur plusieurs lignes (tableaux denses). */
  wrapLabel?: boolean
  /** Tronquer le libellé sur une ligne (défaut). Désactiver pour afficher le texte complet. */
  truncateLabel?: boolean
  /** Permet de valider une saisie libre absente de la liste (type Select2 / création). */
  creatable?: boolean
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Sélectionner...",
  searchPlaceholder = "Rechercher...",
  emptyMessage = "Aucun résultat.",
  disabled = false,
  clearable = true,
  loading = false,
  className,
  wrapLabel = false,
  truncateLabel = true,
  creatable = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [listKey, setListKey] = React.useState(0)

  const selected = React.useMemo(() => {
    if (!value) return undefined
    return options.find((o) => o.value === value) ?? { value, label: value }
  }, [options, value])

  // Group options if any have a `group` property
  const grouped = React.useMemo(() => {
    const groups: Record<string, ComboboxOption[]> = {}
    const ungrouped: ComboboxOption[] = []
    for (const opt of options) {
      if (opt.group) {
        groups[opt.group] = [...(groups[opt.group] ?? []), opt]
      } else {
        ungrouped.push(opt)
      }
    }
    return { groups, ungrouped }
  }, [options])

  const selectedLabelClass = wrapLabel
    ? "min-w-0 flex-1 whitespace-normal text-left leading-snug"
    : truncateLabel
      ? "truncate min-w-0"
      : "whitespace-nowrap"

  const optionLabelClass = wrapLabel
    ? "whitespace-normal break-words"
    : truncateLabel
      ? "min-w-0 flex-1 truncate"
      : "flex-1 whitespace-nowrap"

  const commandItemClass = cn(
    "gap-2",
    wrapLabel && "items-start",
    !wrapLabel && "items-center",
  )

  const popoverContentClass = wrapLabel
    ? "w-[400px] max-w-[95vw]"
    : "w-[var(--radix-popover-trigger-width)]"

  function renderOptionContent(opt: ComboboxOption) {
    if (wrapLabel) {
      return (
        <>
          {opt.icon ? <span className="shrink-0 pt-0.5">{opt.icon}</span> : null}
          <span className="flex-1 text-left leading-snug">
            <span className="block whitespace-normal break-words">{opt.label}</span>
            {opt.description ? (
              <span className="mt-0.5 block whitespace-normal break-words text-xs text-muted-foreground">
                {opt.description}
              </span>
            ) : null}
          </span>
          <Check
            className={cn(
              "h-4 w-4 shrink-0 pt-0.5",
              value === opt.value ? "opacity-100" : "opacity-0",
            )}
          />
        </>
      )
    }

    return (
      <>
        {opt.icon ? <span className="shrink-0">{opt.icon}</span> : null}
        <span className={optionLabelClass}>{opt.label}</span>
        {opt.description && (
          <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">
            {opt.description}
          </span>
        )}
        <Check
          className={cn("h-4 w-4 shrink-0", value === opt.value ? "opacity-100" : "opacity-0")}
        />
      </>
    )
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setListKey((k) => k + 1)
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || loading}
          className={cn(
            "w-full justify-between font-normal",
            wrapLabel && "h-auto min-h-9 items-start py-2 whitespace-normal",
            !wrapLabel && !truncateLabel && "h-9 whitespace-nowrap",
            className,
          )}
        >
          <span
            className={cn(
              "flex min-w-0 flex-1 gap-2",
              wrapLabel ? "items-start" : "items-center",
            )}
          >
            {selected?.icon ? (
              <span className="shrink-0">{selected.icon}</span>
            ) : null}
            <span
              className={cn(
                selectedLabelClass,
                !selected && "text-muted-foreground",
              )}
            >
              {selected?.label ?? placeholder}
            </span>
          </span>
          <span
            className={cn(
              "ml-2 flex shrink-0 items-center gap-1",
              wrapLabel && "self-start pt-0.5",
            )}
          >
            {clearable && selected && (
              <X
                className="h-3.5 w-3.5 opacity-50 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation()
                  onChange?.(undefined)
                }}
              />
            )}
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin opacity-50" />
            ) : (
              <ChevronsUpDown className="h-4 w-4 opacity-40" />
            )}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "flex max-h-[var(--radix-popover-content-available-height)] flex-col overflow-hidden p-0",
          popoverContentClass,
        )}
        align="start"
        side="bottom"
        sideOffset={4}
        collisionPadding={12}
      >
        <Command
          key={listKey}
          filter={comboboxCommandFilter}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList className="max-h-[min(280px,calc(var(--radix-popover-content-available-height)-2.75rem))] min-h-0 overflow-y-auto">
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            {/* Ungrouped */}
            {grouped.ungrouped.length > 0 && (
              <CommandGroup>
                {grouped.ungrouped.map((opt) => (
                  <CommandItem
                    key={opt.value}
                    value={comboboxItemSearchValue(opt)}
                    keywords={comboboxItemKeywords(opt)}
                    disabled={opt.disabled}
                    onSelect={() => {
                      onChange?.(opt.value === value ? undefined : opt.value)
                      setOpen(false)
                    }}
                    className={commandItemClass}
                  >
                    {renderOptionContent(opt)}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {/* Grouped */}
            {Object.entries(grouped.groups).map(([groupName, opts], i) => (
              <React.Fragment key={groupName}>
                {(grouped.ungrouped.length > 0 || i > 0) && <CommandSeparator />}
                <CommandGroup heading={groupName}>
                  {opts.map((opt) => (
                    <CommandItem
                      key={opt.value}
                      value={comboboxItemSearchValue(opt)}
                      keywords={comboboxItemKeywords(opt)}
                      disabled={opt.disabled}
                      onSelect={() => {
                        onChange?.(opt.value === value ? undefined : opt.value)
                        setOpen(false)
                      }}
                      className={commandItemClass}
                    >
                      {renderOptionContent(opt)}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </React.Fragment>
            ))}
            {creatable ? (
              <ComboboxCreatableRow
                options={options}
                onPick={(text) => {
                  onChange?.(text)
                  setOpen(false)
                }}
              />
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function ComboboxCreatableRow({
  options,
  onPick,
}: {
  options: ComboboxOption[]
  onPick: (text: string) => void
}) {
  const search = useCommandState((s) => s.search)
  const filteredCount = useCommandState((s) => s.filtered.count)
  const q = search.trim()
  if (!q || filteredCount > 0) return null
  const exists = options.some(
    (o) =>
      o.value === q ||
      o.label.toLowerCase() === q.toLowerCase(),
  )
  if (exists) return null
  return (
    <CommandGroup heading="Saisie libre">
      <CommandItem
        value={`__creatable__${q}`}
        onSelect={() => onPick(q)}
        className="gap-2"
      >
        <Search className="h-4 w-4 shrink-0 opacity-50" />
        <span className="flex-1">Utiliser « {q} »</span>
      </CommandItem>
    </CommandGroup>
  )
}

// ─── Multi Select Combobox ────────────────────────────────────────────────────
interface MultiComboboxProps {
  options: ComboboxOption[]
  value?: string[]
  onChange?: (value: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  maxDisplay?: number
  className?: string
}

export function MultiCombobox({
  options,
  value = [],
  onChange,
  placeholder = "Sélectionner...",
  searchPlaceholder = "Rechercher...",
  emptyMessage = "Aucun résultat.",
  disabled = false,
  maxDisplay = 3,
  className,
}: MultiComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const selectedOptions = options.filter((o) => value.includes(o.value))

  const toggle = (optValue: string) => {
    if (value.includes(optValue)) {
      onChange?.(value.filter((v) => v !== optValue))
    } else {
      onChange?.([...value, optValue])
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full min-h-10 h-auto justify-start gap-1 font-normal py-2 flex-wrap",
            className
          )}
        >
          {selectedOptions.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            <>
              {selectedOptions.slice(0, maxDisplay).map((opt) => (
                <Badge
                  key={opt.value}
                  variant="secondary"
                  className="gap-1 pr-1 text-xs"
                >
                  {opt.label}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggle(opt.value)
                    }}
                  />
                </Badge>
              ))}
              {selectedOptions.length > maxDisplay && (
                <Badge variant="outline" className="text-xs">
                  +{selectedOptions.length - maxDisplay}
                </Badge>
              )}
            </>
          )}
          <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-40" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="flex max-h-[var(--radix-popover-content-available-height)] w-[var(--radix-popover-trigger-width)] flex-col overflow-hidden p-0"
        align="start"
        side="bottom"
        sideOffset={4}
        collisionPadding={12}
      >
        <Command filter={comboboxCommandFilter} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList className="max-h-[min(280px,calc(var(--radix-popover-content-available-height)-2.75rem))] min-h-0 overflow-y-auto">
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={comboboxItemSearchValue(opt)}
                  keywords={comboboxItemKeywords(opt)}
                  disabled={opt.disabled}
                  onSelect={() => toggle(opt.value)}
                  className="gap-2"
                >
                  <div className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded border border-primary",
                    value.includes(opt.value)
                      ? "bg-primary text-primary-foreground"
                      : "opacity-50"
                  )}>
                    {value.includes(opt.value) && <Check className="h-3 w-3" />}
                  </div>
                  {opt.icon}
                  <span className="flex-1">{opt.label}</span>
                  {opt.description && (
                    <span className="text-xs text-muted-foreground">{opt.description}</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
