import { useParams, useSearchParams } from 'react-router-dom';
import { BracketGrid } from '../components/BracketGrid';

export function BracketEditorPage() {
  const { userId } = useParams<{ userId: string }>();
  const [searchParams] = useSearchParams();
  const bracketName = searchParams.get('name') ?? 'My Bracket';

  if (!userId) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f0f0f]">
        <p className="text-red-400">Missing user ID</p>
      </div>
    );
  }

  return <BracketGrid userId={userId} bracketName={bracketName} />;
}
