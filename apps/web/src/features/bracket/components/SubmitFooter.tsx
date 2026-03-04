import { Button } from '@movable-madness/ui';
import { TOTAL_PICKS } from '../lib/bracket-utils';

interface SubmitFooterProps {
  pickCount: number;
  isSubmitting: boolean;
  onSubmit: () => void;
}

export function SubmitFooter({ pickCount, isSubmitting, onSubmit }: SubmitFooterProps) {
  const isComplete = pickCount >= TOTAL_PICKS;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between bg-[#E31C79] px-6 py-3">
      <span className="text-sm font-medium text-white">
        {pickCount}/{TOTAL_PICKS} picks made
      </span>
      <Button
        onClick={onSubmit}
        disabled={!isComplete || isSubmitting}
        className="bg-white text-[#E31C79] hover:bg-white/90 disabled:opacity-50"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Bracket'}
      </Button>
    </div>
  );
}
