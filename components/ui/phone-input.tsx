"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
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
import { ChevronsUpDown, Check } from "lucide-react"
import { PHONE_COUNTRIES, type PhoneCountry } from "@/lib/phone"

interface PhoneInputProps {
  value?: string
  onChange?: (value: string) => void
  defaultCountry?: string
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function PhoneInput({
  value = "",
  onChange,
  defaultCountry = "CM",
  placeholder = "6 xx xx xx xx",
  disabled = false,
  className,
}: PhoneInputProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedCountry, setSelectedCountry] = React.useState<PhoneCountry>(
    PHONE_COUNTRIES.find((c) => c.code === defaultCountry) ?? PHONE_COUNTRIES[0]!,
  )
  const [localNumber, setLocalNumber] = React.useState(
    value.startsWith(`+${selectedCountry.dial}`)
      ? value.slice(`+${selectedCountry.dial}`.length).trim()
      : value,
  )

  const handleCountryChange = (country: PhoneCountry) => {
    setSelectedCountry(country)
    setOpen(false)
    onChange?.(`+${country.dial} ${localNumber}`)
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = e.target.value.replace(/[^\d\s\-()]/g, "")
    setLocalNumber(num)
    onChange?.(`+${selectedCountry.dial} ${num}`)
  }

  return (
    <div className={cn("flex gap-0", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            disabled={disabled}
            className="w-28 shrink-0 gap-1.5 rounded-r-none border-r-0 px-2 font-normal"
            type="button"
          >
            <span>{selectedCountry.flag}</span>
            <span className="text-sm">+{selectedCountry.dial}</span>
            <ChevronsUpDown className="ml-auto h-3 w-3 opacity-40" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <Command>
            <CommandInput placeholder="Rechercher un pays..." />
            <CommandList>
              <CommandEmpty>Aucun pays trouvé.</CommandEmpty>
              <CommandGroup>
                {PHONE_COUNTRIES.map((country) => (
                  <CommandItem
                    key={country.code}
                    value={`${country.name} ${country.dial}`}
                    onSelect={() => handleCountryChange(country)}
                    className="gap-2"
                  >
                    <span>{country.flag}</span>
                    <span className="flex-1">{country.name}</span>
                    <span className="text-xs text-muted-foreground">
                      +{country.dial}
                    </span>
                    <Check
                      className={cn(
                        "h-4 w-4 shrink-0",
                        selectedCountry.code === country.code
                          ? "opacity-100"
                          : "opacity-0",
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
        type="tel"
        value={localNumber}
        onChange={handleNumberChange}
        placeholder={placeholder}
        disabled={disabled}
        className="rounded-l-none"
      />
    </div>
  )
}
