"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"
import {
  PHONE_COUNTRIES,
  composeWhatsAppPhone,
  detectPhoneCountry,
  digitsOnly,
  nationalPhonePart,
  type PhoneCountry,
} from "@/lib/phone"

export function WhatsAppPhoneInput({
  id,
  value,
  onChange,
  required,
  className,
  placeholder = "6XX XX XX XX",
  disabled = false,
}: {
  id?: string
  value: string
  onChange: (normalized: string) => void
  required?: boolean
  className?: string
  placeholder?: string
  disabled?: boolean
}) {
  const [open, setOpen] = React.useState(false)
  const [country, setCountry] = React.useState<PhoneCountry>(() =>
    detectPhoneCountry(value),
  )
  const [display, setDisplay] = React.useState(() => nationalPhonePart(value))

  React.useEffect(() => {
    setCountry(detectPhoneCountry(value))
    setDisplay(nationalPhonePart(value))
  }, [value])

  function emit(nextCountry: PhoneCountry, national: string) {
    const maxLen = nextCountry.nationalLength ?? 12
    const d = digitsOnly(national).replace(/^0+/, "").slice(0, maxLen)
    setDisplay(d)
    if (!d) {
      onChange("")
      return
    }
    const normalized = composeWhatsAppPhone(nextCountry.dial, d)
    onChange(normalized ?? `${nextCountry.dial}${d}`)
  }

  function handleCountryChange(next: PhoneCountry) {
    setCountry(next)
    setOpen(false)
    emit(next, display)
  }

  return (
    <div className={cn("flex", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="h-9 w-[7.25rem] shrink-0 gap-1 rounded-r-none border-r-0 px-2 font-normal"
          >
            <span aria-hidden>{country.flag}</span>
            <span className="text-sm tabular-nums">+{country.dial}</span>
            <ChevronsUpDown className="ml-auto h-3 w-3 shrink-0 opacity-40" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <Command>
            <CommandInput placeholder="Rechercher un pays…" />
            <CommandList>
              <CommandEmpty>Aucun pays trouvé.</CommandEmpty>
              <CommandGroup>
                {PHONE_COUNTRIES.map((c) => (
                  <CommandItem
                    key={c.code}
                    value={`${c.name} ${c.dial}`}
                    onSelect={() => handleCountryChange(c)}
                    className="gap-2"
                  >
                    <span aria-hidden>{c.flag}</span>
                    <span className="flex-1">{c.name}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      +{c.dial}
                    </span>
                    <Check
                      className={cn(
                        "h-4 w-4 shrink-0",
                        country.code === c.code ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <Input
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        value={display}
        onChange={(e) => emit(country, e.target.value)}
        className="rounded-l-none"
      />
    </div>
  )
}
