import {
  Badge,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@movable-madness/ui';
import type { BracketEntry } from '../model/bracket.types';

interface SubmittedBracketsTableProps {
  brackets: BracketEntry[];
  loading: boolean;
}

function StatusBadge({ status }: { status: BracketEntry['status'] }) {
  if (status === 'submitted') {
    return (
      <Badge className="border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
        Picks Submitted
      </Badge>
    );
  }
  return <Badge variant="secondary">In Progress</Badge>;
}

const SKELETON_KEYS = ['skeleton-1', 'skeleton-2', 'skeleton-3', 'skeleton-4'];

function SkeletonRows() {
  return (
    <>
      {SKELETON_KEYS.map((key) => (
        <TableRow key={key}>
          <TableCell>
            <Skeleton className="h-4 w-40" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-28" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function SubmittedBracketsTable({ brackets, loading }: SubmittedBracketsTableProps) {
  return (
    <div className="rounded-lg border-t-4 border-t-[#E31C79] shadow-md">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-background">
          <TableRow>
            <TableHead className="font-semibold">Bracket Name</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <SkeletonRows />
          ) : (
            brackets.map((bracket) => (
              <TableRow key={bracket.id} className="even:bg-muted/50">
                <TableCell className="font-medium">{bracket.bracketName}</TableCell>
                <TableCell>
                  <StatusBadge status={bracket.status} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
