'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

function Table({ className, ...props }: React.ComponentProps<'table'>) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn('w-full caption-bottom text-sm', className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
  return (
    <thead
      data-slot="table-header"
      className={cn('[&_tr]:border-b', className)}
      {...props}
    />
  )
}

export type TableBodyProps = React.ComponentProps<'tbody'> & {
  /** Lignes paires en fond alterné (contraste lisible sur fond carte blanc). */
  striped?: boolean
}

function TableBody({ className, striped = true, ...props }: TableBodyProps) {
  return (
    <tbody
      data-slot="table-body"
      data-striped={striped ? 'true' : 'false'}
      className={cn(
        '[&_tr:last-child]:border-0',
        striped &&
          cn(
            /* Zébrage : #f1f3f5 = surface.muted (design CKS), bien visible sur blanc */
            '[&>tr:nth-child(even)]:bg-[#f1f3f5]',
            '[&>tr:nth-child(even):hover]:bg-[#e9ecef]',
            '[&>tr:nth-child(odd):hover]:bg-muted/55',
            'dark:[&>tr:nth-child(even)]:bg-muted/45',
            'dark:[&>tr:nth-child(even):hover]:bg-muted/60',
            'dark:[&>tr:nth-child(odd):hover]:bg-muted/35',
          ),
        !striped && '[&>tr:hover]:bg-muted/50',
        className,
      )}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<'tfoot'>) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        'bg-muted/50 border-t font-medium [&>tr]:last:border-b-0',
        className,
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<'tr'>) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        /* Survol géré par TableBody (striped ou non) pour ne pas masquer le zébrage */
        'border-b transition-colors data-[state=selected]:bg-muted',
        className,
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<'th'>) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        'text-foreground h-11 py-2.5 pl-2 pr-3 text-left align-middle font-medium whitespace-nowrap first:pl-1.5 [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
        className,
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<'td'>) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        'py-2.5 pl-2 pr-3 align-middle whitespace-nowrap first:pl-1.5 [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
        className,
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<'caption'>) {
  return (
    <caption
      data-slot="table-caption"
      className={cn('text-muted-foreground mt-4 text-sm', className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
