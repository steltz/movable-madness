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
          className={
            i % 2 === 0
              ? 'border-0 bg-white dark:bg-zinc-900'
              : 'border-0 bg-[#fdf2f8] dark:bg-zinc-800'
          }
        >
          <TableCell className="px-5 py-3">
            <div className="h-4 w-3/5 animate-pulse rounded bg-pink-200 dark:bg-zinc-700" />
          </TableCell>
          <TableCell className="px-5 py-3">
            <div className="h-4 w-2/6 animate-pulse rounded bg-pink-200 dark:bg-zinc-700" />
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
    <div className="overflow-hidden rounded-xl border-t-4 border-t-[#E31C79] shadow-md dark:shadow-lg dark:shadow-black/20">
      {/* Branded header bar */}
      <div className="bg-gradient-to-br from-[#E31C79] to-[#c4156a] px-5 py-4">
        <span className="text-base font-bold tracking-tight text-white">Submitted Brackets</span>
        {!loading && (
          <span className="ml-3 text-[13px] text-white/70">
            {count} {count === 1 ? 'participant' : 'participants'}
          </span>
        )}
      </div>

      <Table>
        <TableHeader className="sticky top-0 z-10">
          <TableRow className="border-b-2 border-b-pink-200 bg-[#fdf2f8] hover:bg-[#fdf2f8] dark:border-b-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-800">
            <TableHead className="px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-[#831843] dark:text-pink-300">
              Bracket Name
            </TableHead>
            <TableHead className="px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-[#831843] dark:text-pink-300">
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
                    ? 'border-0 bg-white hover:bg-pink-50/50 dark:bg-zinc-900 dark:hover:bg-zinc-900/80'
                    : 'border-0 bg-[#fdf2f8] hover:bg-pink-100/50 dark:bg-zinc-800 dark:hover:bg-zinc-800/80'
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
