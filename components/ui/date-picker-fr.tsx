"use client"

import * as React from "react"
import { format, isValid, parse } from "date-fns"
import { fr as dateFnsFr } from "date-fns/locale"
import { fr } from "react-day-picker/locale"
import { CalendarIcon, Clock, X } from "lucide-react"
import { APP_TIMEZONE, formatInAppTimezone } from "@/lib/timezone"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const FRENCH_CALENDAR_FORMATTERS = {
  formatMonthDropdown: (date: Date) =>
    format(date, "LLLL", { locale: dateFnsFr }),
  formatYearDropdown: (date: Date) => format(date, "yyyy", { locale: dateFnsFr }),
  formatWeekdayName: (date: Date) =>
    format(date, "EEEEEE", { locale: dateFnsFr }),
}

/** Affichage court français : 04/07/2026 */
function formatDateFr(date: Date): string {
  return format(date, "dd/MM/yyyy", { locale: dateFnsFr })
}

export function parseIsoDateString(value?: string): Date | undefined {
  if (!value) return undefined
  const isoDay = value.slice(0, 10)
  const d = parse(isoDay, "yyyy-MM-dd", new Date())
  return isValid(d) ? d : undefined
}

export function toIsoDateString(date?: Date): string {
  if (!date || !isValid(date)) return ""
  return format(date, "yyyy-MM-dd")
}

function resolveDate(value?: Date, dateValue?: string): Date | undefined {
  if (dateValue !== undefined) return parseIsoDateString(dateValue)
  return value
}

function resolveMinMax(value?: Date | string): Date | undefined {
  if (!value) return undefined
  if (typeof value === "string") return parseIsoDateString(value)
  return value
}

interface DatePickerFrProps {
  value?: Date
  /** Valeur ISO yyyy-MM-dd (prioritaire sur value). */
  dateValue?: string
  onChange?: (date: Date | undefined) => void
  /** Reçoit une chaîne ISO yyyy-MM-dd. */
  onDateChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  clearable?: boolean
  className?: string
  id?: string
  fromYear?: number
  toYear?: number
  min?: Date | string
  max?: Date | string
}

export function DatePickerFr({
  value,
  dateValue,
  onChange,
  onDateChange,
  placeholder = "Sélectionner une date",
  disabled = false,
  clearable = true,
  className,
  id,
  fromYear = 1900,
  toYear = new Date().getFullYear() + 5,
  min,
  max,
}: DatePickerFrProps) {
  const [open, setOpen] = React.useState(false)
  const selectedDate = resolveDate(value, dateValue)
  const minDate = resolveMinMax(min)
  const maxDate = resolveMinMax(max)

  function handleSelect(date: Date | undefined) {
    onChange?.(date)
    onDateChange?.(toIsoDateString(date))
    setOpen(false)
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation()
    onChange?.(undefined)
    onDateChange?.("")
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !selectedDate && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-60" />
          <span className="flex-1 truncate">
            {selectedDate ? formatDateFr(selectedDate) : placeholder}
          </span>
          {clearable && selectedDate && (
            <X
              className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50 hover:opacity-100"
              onClick={handleClear}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          locale={fr}
          captionLayout="dropdown"
          fromYear={fromYear}
          toYear={toYear}
          disabled={
            minDate || maxDate
              ? [
                  ...(minDate ? [{ before: minDate }] : []),
                  ...(maxDate ? [{ after: maxDate }] : []),
                ]
              : undefined
          }
          formatters={FRENCH_CALENDAR_FORMATTERS}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

interface DateRangePickerFrProps {
  value?: { from: Date | undefined; to: Date | undefined }
  fromValue?: string
  toValue?: string
  onChange?: (range: { from: Date | undefined; to: Date | undefined }) => void
  onRangeChange?: (range: { from: string; to: string }) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function DateRangePickerFr({
  value,
  fromValue,
  toValue,
  onChange,
  onRangeChange,
  placeholder = "Sélectionner une période",
  disabled = false,
  className,
}: DateRangePickerFrProps) {
  const [open, setOpen] = React.useState(false)

  const selected = React.useMemo(() => {
    if (fromValue !== undefined || toValue !== undefined) {
      return {
        from: parseIsoDateString(fromValue),
        to: parseIsoDateString(toValue),
      }
    }
    return value
  }, [fromValue, toValue, value])

  const displayValue = React.useMemo(() => {
    if (selected?.from && selected?.to) {
      return `${formatDateFr(selected.from)} – ${formatDateFr(selected.to)}`
    }
    if (selected?.from) {
      return `${formatDateFr(selected.from)} – ...`
    }
    return null
  }, [selected])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !displayValue && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-60" />
          <span className="flex-1 truncate">{displayValue ?? placeholder}</span>
          {displayValue && (
            <X
              className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50 hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation()
                onChange?.({ from: undefined, to: undefined })
                onRangeChange?.({ from: "", to: "" })
              }}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={selected}
          onSelect={(range) => {
            const next = range
              ? { from: range.from, to: range.to ?? undefined }
              : { from: undefined, to: undefined }
            onChange?.(next)
            onRangeChange?.({
              from: toIsoDateString(next.from),
              to: toIsoDateString(next.to),
            })
          }}
          locale={fr}
          numberOfMonths={2}
          formatters={FRENCH_CALENDAR_FORMATTERS}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

interface DateTimePickerFrProps {
  /** Format datetime-local : yyyy-MM-ddTHH:mm */
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  id?: string
}

export function DateTimePickerFr({
  value = "",
  onChange,
  placeholder = "Sélectionner date et heure",
  disabled = false,
  className,
  id,
}: DateTimePickerFrProps) {
  const datePart = value.slice(0, 10)
  const timePart = value.slice(11, 16) || "09:00"

  const selectedDate = parseIsoDateString(datePart)
  const displayValue =
    selectedDate && value
      ? `${formatInAppTimezone(selectedDate, {
          day: "numeric",
          month: "long",
          year: "numeric",
        })} à ${timePart} (Douala)`
      : null

  function updateDate(nextDate: string) {
    if (!nextDate) {
      onChange?.("")
      return
    }
    onChange?.(`${nextDate}T${timePart}`)
  }

  function updateTime(nextTime: string) {
    if (!datePart) return
    onChange?.(`${datePart}T${nextTime}`)
  }

  return (
    <div className={cn("flex flex-col gap-2 sm:flex-row", className)}>
      <DatePickerFr
        id={id}
        dateValue={datePart}
        onDateChange={updateDate}
        placeholder={placeholder}
        disabled={disabled}
        clearable={false}
        className="flex-1"
      />
      <div className="relative sm:w-[130px]">
        <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="time"
          value={timePart}
          disabled={disabled || !datePart}
          onChange={(e) => updateTime(e.target.value)}
          className="h-10 pl-9"
          aria-label={`Heure (${APP_TIMEZONE})`}
        />
      </div>
      {displayValue ? (
        <p className="sr-only">{displayValue}</p>
      ) : null}
    </div>
  )
}
