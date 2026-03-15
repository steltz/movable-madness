import { Button } from '@movable-madness/ui';
import { TOTAL_MATCHUPS } from '../model/teams';

interface SubmitFooterProps {
  picksCount: number;
  isComplete: boolean;
  isSubmitting: boolean;
  submitError: string | null;
  onSubmit: () => void;
}

export function SubmitFooter({
  picksCount,
  isComplete,
  isSubmitting,
  submitError,
  onSubmit,
}: SubmitFooterProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {submitError && (
        <div className="bg-destructive/90 px-4 py-2 text-center text-sm text-destructive-foreground">
          {submitError}
        </div>
      )}
      <div className="flex items-center justify-between bg-[#E31C79] px-6 py-4">
        <span className="text-sm font-medium text-white">
          <span className="font-bold">
            {picksCount} of {TOTAL_MATCHUPS}
          </span>{' '}
          picks made
        </span>
        <Button variant="secondary" disabled={!isComplete || isSubmitting} onClick={onSubmit}>
          {isSubmitting ? 'Submitting...' : 'Submit Bracket'}
        </Button>
      </div>
    </div>
  );
}
