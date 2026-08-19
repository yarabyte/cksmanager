"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Toggle } from "@/components/ui/toggle"
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading2,
  Heading3,
  Link,
  Unlink,
  Undo2,
  Redo2,
  Quote,
  Code,
  Minus,
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface RichTextEditorProps {
  value?: string
  onChange?: (html: string) => void
  placeholder?: string
  disabled?: boolean
  minHeight?: number
  className?: string
}

type FormatCommand =
  | "bold" | "italic" | "underline" | "strikeThrough"
  | "insertUnorderedList" | "insertOrderedList"
  | "justifyLeft" | "justifyCenter" | "justifyRight"
  | "formatBlock" | "createLink" | "unlink"
  | "insertHorizontalRule" | "undo" | "redo"

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Saisissez votre texte...",
  disabled = false,
  minHeight = 200,
  className,
}: RichTextEditorProps) {
  const editorRef = React.useRef<HTMLDivElement>(null)
  const [activeFormats, setActiveFormats] = React.useState<Set<string>>(new Set())

  // Initialise with value
  React.useEffect(() => {
    if (editorRef.current && value !== undefined && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value
    }
  }, []) // Only on mount

  const exec = React.useCallback((command: FormatCommand, arg?: string) => {
    if (disabled) return
    editorRef.current?.focus()
    document.execCommand(command, false, arg)
    updateActiveFormats()
    onChange?.(editorRef.current?.innerHTML ?? "")
  }, [disabled, onChange])

  const updateActiveFormats = () => {
    const formats = new Set<string>()
    const checks: string[] = ["bold", "italic", "underline", "strikeThrough", "insertUnorderedList", "insertOrderedList"]
    for (const cmd of checks) {
      if (document.queryCommandState(cmd)) formats.add(cmd)
    }
    setActiveFormats(formats)
  }

  const handleLinkInsert = () => {
    const url = window.prompt("Entrer l'URL du lien:")
    if (url) exec("createLink", url)
  }

  const toolbarGroups = [
    {
      items: [
        { icon: <Undo2 className="h-4 w-4" />, command: "undo" as FormatCommand, label: "Annuler" },
        { icon: <Redo2 className="h-4 w-4" />, command: "redo" as FormatCommand, label: "Rétablir" },
      ],
    },
    {
      items: [
        { icon: <Heading2 className="h-4 w-4" />, command: "formatBlock" as FormatCommand, arg: "h2", label: "Titre 2" },
        { icon: <Heading3 className="h-4 w-4" />, command: "formatBlock" as FormatCommand, arg: "h3", label: "Titre 3" },
        { icon: <Quote className="h-4 w-4" />, command: "formatBlock" as FormatCommand, arg: "blockquote", label: "Citation" },
      ],
    },
    {
      items: [
        { icon: <Bold className="h-4 w-4" />, command: "bold" as FormatCommand, label: "Gras", toggle: true },
        { icon: <Italic className="h-4 w-4" />, command: "italic" as FormatCommand, label: "Italique", toggle: true },
        { icon: <Underline className="h-4 w-4" />, command: "underline" as FormatCommand, label: "Souligné", toggle: true },
        { icon: <Strikethrough className="h-4 w-4" />, command: "strikeThrough" as FormatCommand, label: "Barré", toggle: true },
        { icon: <Code className="h-4 w-4" />, command: "formatBlock" as FormatCommand, arg: "pre", label: "Code" },
      ],
    },
    {
      items: [
        { icon: <List className="h-4 w-4" />, command: "insertUnorderedList" as FormatCommand, label: "Liste à puces", toggle: true },
        { icon: <ListOrdered className="h-4 w-4" />, command: "insertOrderedList" as FormatCommand, label: "Liste numérotée", toggle: true },
        { icon: <Minus className="h-4 w-4" />, command: "insertHorizontalRule" as FormatCommand, label: "Ligne de séparation" },
      ],
    },
    {
      items: [
        { icon: <AlignLeft className="h-4 w-4" />, command: "justifyLeft" as FormatCommand, label: "Aligner à gauche" },
        { icon: <AlignCenter className="h-4 w-4" />, command: "justifyCenter" as FormatCommand, label: "Centrer" },
        { icon: <AlignRight className="h-4 w-4" />, command: "justifyRight" as FormatCommand, label: "Aligner à droite" },
      ],
    },
  ]

  return (
    <TooltipProvider>
      <div className={cn("rounded-md border border-input bg-background focus-within:ring-1 focus-within:ring-ring", className)}>
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-0.5 border-b border-input p-1">
          {toolbarGroups.map((group, gi) => (
            <React.Fragment key={gi}>
              {gi > 0 && (
                <Separator orientation="vertical" className="mx-1 h-6" />
              )}
              {group.items.map((item) =>
                item.command === "createLink" ? null : (
                  <Tooltip key={item.label} delayDuration={400}>
                    <TooltipTrigger asChild>
                      {item.toggle ? (
                        <Toggle
                          size="sm"
                          pressed={activeFormats.has(item.command)}
                          onPressedChange={() =>
                            exec(item.command, 'arg' in item ? item.arg : undefined)
                          }
                          disabled={disabled}
                          className="h-7 w-7 p-0"
                          aria-label={item.label}
                        >
                          {item.icon}
                        </Toggle>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() =>
                            exec(item.command, 'arg' in item ? item.arg : undefined)
                          }
                          disabled={disabled}
                          type="button"
                          aria-label={item.label}
                        >
                          {item.icon}
                        </Button>
                      )}
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">{item.label}</TooltipContent>
                  </Tooltip>
                )
              )}
            </React.Fragment>
          ))}

          {/* Link buttons */}
          <Separator orientation="vertical" className="mx-1 h-6" />
          <Tooltip delayDuration={400}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleLinkInsert} disabled={disabled} type="button">
                <Link className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">Insérer un lien</TooltipContent>
          </Tooltip>
          <Tooltip delayDuration={400}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => exec("unlink")} disabled={disabled} type="button">
                <Unlink className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">Supprimer le lien</TooltipContent>
          </Tooltip>
        </div>

        {/* Editable area */}
        <div
          ref={editorRef}
          contentEditable={!disabled}
          suppressContentEditableWarning
          onInput={() => {
            updateActiveFormats()
            onChange?.(editorRef.current?.innerHTML ?? "")
          }}
          onKeyUp={updateActiveFormats}
          onMouseUp={updateActiveFormats}
          data-placeholder={placeholder}
          className={cn(
            "prose prose-sm max-w-none px-3 py-2 text-sm outline-none",
            "prose-headings:font-semibold prose-h2:text-lg prose-h3:text-base",
            "prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground",
            "prose-pre:bg-muted prose-pre:text-xs prose-code:text-primary",
            "empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground empty:before:pointer-events-none",
            disabled && "cursor-not-allowed opacity-60",
          )}
          style={{ minHeight }}
        />
      </div>
    </TooltipProvider>
  )
}
