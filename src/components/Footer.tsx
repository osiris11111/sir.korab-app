import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="w-full bg-surface-container-lowest border-t border-outline-variant/10 py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="text-sm text-on-surface-variant/50">
          &copy; SirKorab 2026 all rights reserved
        </div>
      </div>
    </footer>
  );
}
