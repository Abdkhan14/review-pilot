export function Footer() {
  return (
    <footer className="border-t border-zinc-200 px-6 py-10">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-zinc-500">
        <span className="font-semibold tracking-widest uppercase text-zinc-400">
          Review Pilot
        </span>
        <nav className="flex gap-6">
          <a href="/terms" className="hover:text-zinc-900 transition-colors">Terms</a>
          <a href="/privacy" className="hover:text-zinc-900 transition-colors">Privacy</a>
        </nav>
        <span>© {new Date().getFullYear()} Review Pilot</span>
      </div>
    </footer>
  );
}
