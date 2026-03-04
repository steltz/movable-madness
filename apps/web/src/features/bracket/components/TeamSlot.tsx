import type { Team } from '@movable-madness/shared-types';

interface TeamSlotProps {
  team: Team | null;
  isSelected: boolean;
  isDisabled: boolean;
  onClick: () => void;
}

export function TeamSlot({ team, isSelected, isDisabled, onClick }: TeamSlotProps) {
  if (!team) {
    return (
      <div className="flex h-9 w-44 items-center rounded border border-[#2a2a2a] bg-[#1a1a1a] px-2 opacity-40">
        <span className="text-xs text-[#999]">TBD</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className={`flex h-9 w-44 items-center gap-2 rounded border px-2 text-left transition-colors
        ${
          isSelected
            ? 'border-[#E31C79] bg-[#E31C79]/10 text-white'
            : 'border-[#2a2a2a] bg-[#1a1a1a] text-white hover:bg-[#252525]'
        }
        ${isDisabled ? 'pointer-events-none opacity-40' : 'cursor-pointer'}
      `}
    >
      <span className="min-w-5 text-xs text-[#999]">{team.seed}</span>
      <span className="truncate text-sm font-medium">{team.name}</span>
    </button>
  );
}
