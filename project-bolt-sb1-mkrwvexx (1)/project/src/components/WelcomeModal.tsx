import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';

export default function WelcomeModal() {
  const { profile } = useAuth();
  const [show, setShow] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem('thriftly_welcome_shown');
    if (!seen) setShow(true);
  }, []);

  useEffect(() => {
    if (show) {
      // Trigger fade-in on next frame
      requestAnimationFrame(() => setVisible(true));
    }
  }, [show]);

  function dismiss() {
    setVisible(false);
    setTimeout(() => {
      setShow(false);
      localStorage.setItem('thriftly_welcome_shown', 'true');
    }, 300);
  }

  if (!show) return null;

  const firstName = profile?.full_name?.split(' ')[0] || 'there';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-5"
      style={{
        backgroundColor: `rgba(0,0,0,${visible ? 0.6 : 0})`,
        transition: 'background-color 300ms ease',
      }}
      onClick={dismiss}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-[440px] p-9"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(8px)',
          transition: 'opacity 300ms ease, transform 300ms ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Wordmark */}
        <p className="text-center text-lg font-bold text-zinc-950 tracking-tight mb-4">
          Thriftly 🖤
        </p>
        <hr className="border-zinc-100 mb-6" />

        {/* Message */}
        <p className="text-xs text-zinc-400 text-center mb-2">From the Founder</p>
        <p className="text-sm text-zinc-700 leading-relaxed text-center mb-8">
          Hello {firstName}, welcome to the Thriftly family 🖤
          <br /><br />
          Hope you have an amazing experience here. Thank you for choosing us.
        </p>

        {/* CTA */}
        <button
          onClick={dismiss}
          className="w-full py-3.5 rounded-full bg-black text-white text-sm font-semibold hover:bg-zinc-800 transition-colors duration-200"
        >
          Let's go →
        </button>
      </div>
    </div>
  );
}
