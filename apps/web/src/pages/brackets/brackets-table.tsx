import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@movable-madness/ui';
import { Check, Circle } from 'lucide-react';
import type { BracketEntryWithId } from './use-brackets';

interface BracketsTableProps {
  entries: BracketEntryWithId[];
  loading?: boolean;
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }, (_, i) => `skeleton-${i}`).map((key, i) => (
        <TableRow
          key={key}
          className={i % 2 === 0 ? 'border-0 bg-card' : 'border-0 bg-brand-muted'}
        >
          <TableCell className="px-5 py-3">
            <div className="h-4 w-3/5 animate-pulse rounded bg-brand-muted" />
          </TableCell>
          <TableCell className="px-5 py-3">
            <div className="h-4 w-2/6 animate-pulse rounded bg-brand-muted" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

function StatusCell({ status }: { status: BracketEntryWithId['status'] }) {
  if (status === 'submitted') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#166534] dark:text-emerald-400">
        <Check className="size-4" />
        Picks Submitted
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#92400e] dark:text-amber-400">
      <Circle className="size-3.5" />
      In Progress
    </span>
  );
}

export function BracketsTable({ entries, loading }: BracketsTableProps) {
  const count = loading ? 0 : entries.length;

  return (
    <div className="overflow-hidden rounded-xl border-t-4 border-t-brand shadow-md dark:shadow-lg dark:shadow-black/20">
      {/* Branded header bar */}
      <div className="bg-gradient-to-br from-brand to-brand/85 px-5 py-4">
        <span className="text-base font-bold tracking-tight text-brand-foreground">
          Submitted Brackets
        </span>
        {!loading && (
          <span className="ml-3 text-[13px] text-brand-foreground/70">
            {count} {count === 1 ? 'participant' : 'participants'}
          </span>
        )}
      </div>

      <Table>
        <TableHeader className="sticky top-0 z-10">
          <TableRow className="border-b-2 border-b-brand-muted bg-brand-muted hover:bg-brand-muted">
            <TableHead className="px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-brand-muted-foreground">
              Bracket Name
            </TableHead>
            <TableHead className="px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-brand-muted-foreground">
              Status
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <SkeletonRows />
          ) : entries.length === 0 ? (
            <TableRow className="border-0 hover:bg-transparent">
              <TableCell colSpan={2} className="py-12 text-center text-muted-foreground">
                No brackets yet — be the first to enter!
              </TableCell>
            </TableRow>
          ) : (
            entries.map((entry, i) => (
              <TableRow
                key={entry.id}
                className={
                  i % 2 === 0
                    ? 'border-0 bg-card hover:bg-brand-muted/50'
                    : 'border-0 bg-brand-muted hover:bg-brand-muted/80'
                }
              >
                <TableCell className="px-5 py-3 font-medium text-foreground">
                  {entry.bracketName}
                </TableCell>
                <TableCell className="px-5 py-3">
                  <StatusCell status={entry.status} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
