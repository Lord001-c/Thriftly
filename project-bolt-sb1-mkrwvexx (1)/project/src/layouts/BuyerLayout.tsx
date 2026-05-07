import { Outlet, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function BuyerLayout() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-zinc-100 py-6 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-1 text-xs text-zinc-400">
          <span>© {new Date().getFullYear()} Thriftly</span>
          <span className="mx-2">·</span>
          <Link to="/terms" className="hover:text-zinc-600 transition-colors duration-200">
            Terms &amp; Conditions
          </Link>
          <span className="mx-2">·</span>
          <Link to="/privacy" className="hover:text-zinc-600 transition-colors duration-200">
            Privacy Policy
          </Link>
        </div>
      </footer>
    </div>
  );
}
