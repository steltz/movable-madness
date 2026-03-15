import type { Team } from '@movable-madness/shared-types';
import { cn } from '@movable-madness/ui';

interface TeamSlotProps {
  team: Team | null;
  isSelected: boolean;
  onClick: () => void;
}

export function TeamSlot({ team, isSelected, onClick }: TeamSlotProps) {
  if (!team) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-dashed border-border/40 px-3 py-2 text-sm text-muted-foreground">
        <span className="w-5 text-center text-xs">—</span>
        <span>TBD</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 rounded-md border-2 px-3 py-2 text-left text-sm transition-colors',
        'hover:border-foreground/30 cursor-pointer',
        isSelected
          ? 'border-[#E31C79] bg-[#E31C79]/10 text-foreground'
          : 'border-transparent bg-card text-foreground',
      )}
    >
      <span className="w-5 shrink-0 text-center text-xs font-semibold text-muted-foreground">
        {team.seed}
      </span>
      <span className="truncate font-medium">{team.name}</span>
    </button>
  );
}
