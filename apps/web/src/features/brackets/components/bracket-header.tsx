interface BracketHeaderProps {
  bracketName: string;
}

export function BracketHeader({ bracketName }: BracketHeaderProps) {
  return (
    <header className="bg-[#E31C79] px-6 py-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <span className="text-sm font-medium tracking-wide text-white/80">Movable Madness</span>
        <h1 className="text-xl font-bold text-white">{bracketName}</h1>
        <div className="w-24" />
      </div>
    </header>
  );
}
