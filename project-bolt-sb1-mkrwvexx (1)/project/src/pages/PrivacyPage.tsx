import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const sections: { title: string; body: React.ReactNode }[] = [
  {
    title: '1. Introduction',
    body: (
      <p>
        Thriftly ("we", "us", "our") is committed to protecting your privacy. This Privacy Policy
        explains how we collect, use, store, and protect your personal information when you use our
        platform at thriftly01.store.
        <br /><br />
        By using Thriftly you agree to the collection and use of your information as described in this policy.
      </p>
    ),
  },
  {
    title: '2. Information We Collect',
    body: (
      <div className="space-y-4">
        <div>
          <p className="font-medium text-zinc-700 mb-1">When you register:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Full name</li>
            <li>Email address</li>
            <li>Phone number</li>
            <li>Mobile Money number and network provider</li>
            <li>Account type (Buyer or Seller)</li>
          </ul>
        </div>
        <div>
          <p className="font-medium text-zinc-700 mb-1">When you make or receive a payment:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Transaction amount</li>
            <li>Paystack payment reference</li>
            <li>Mobile Money number used for payment</li>
          </ul>
        </div>
        <div>
          <p className="font-medium text-zinc-700 mb-1">When you create a listing:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Product photos</li>
            <li>Item title, description, price, condition, category</li>
            <li>Location information if provided</li>
          </ul>
        </div>
        <div>
          <p className="font-medium text-zinc-700 mb-1">When you place an order:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Delivery address</li>
            <li>Delivery city</li>
            <li>Contact phone number</li>
          </ul>
        </div>
        <div>
          <p className="font-medium text-zinc-700 mb-1">Automatically collected:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Device type and browser</li>
            <li>IP address</li>
            <li>Pages visited and time spent</li>
            <li>App usage patterns</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    title: '3. How We Use Your Information',
    body: (
      <div>
        <p className="mb-2">We use your information to:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Create and manage your account</li>
          <li>Process payments and payouts via Paystack</li>
          <li>Display your listings to buyers</li>
          <li>Deliver orders to buyers</li>
          <li>Send order confirmations and delivery updates</li>
          <li>Resolve disputes between buyers and sellers</li>
          <li>Improve the platform and fix issues</li>
          <li>Send important platform updates via WhatsApp or email</li>
          <li>Prevent fraud and abuse</li>
        </ul>
      </div>
    ),
  },
  {
    title: '4. How We Share Your Information',
    body: (
      <div className="space-y-3">
        <p>We only share your information with:</p>
        <p>
          <span className="font-medium text-zinc-700">Paystack</span> — to process payments and
          seller payouts. Paystack has its own Privacy Policy at paystack.com/privacy.
        </p>
        <p>
          <span className="font-medium text-zinc-700">Supabase</span> — our database provider where
          your data is securely stored. Supabase Privacy Policy at supabase.com/privacy.
        </p>
        <p>
          We do not sell, rent, or trade your personal information to any third party for marketing
          purposes.
        </p>
        <p>
          We may share your information if required by Ghanaian law or a valid court order.
        </p>
      </div>
    ),
  },
  {
    title: '5. Data Storage and Security',
    body: (
      <ul className="list-disc list-inside space-y-1">
        <li>Your data is stored on Supabase servers with industry standard encryption</li>
        <li>Payment data is processed by Paystack and never stored on Thriftly servers</li>
        <li>We use secure HTTPS connections for all data transmission</li>
        <li>Access to your data is restricted to authorised Thriftly staff only</li>
        <li>We never store your Mobile Money PIN or password</li>
      </ul>
    ),
  },
  {
    title: '6. Your Rights',
    body: (
      <div className="space-y-3">
        <p>You have the right to:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Access the personal data we hold about you</li>
          <li>Request correction of inaccurate data</li>
          <li>Request deletion of your account and associated data</li>
          <li>Opt out of marketing communications at any time</li>
        </ul>
        <p>
          To exercise any of these rights contact us at{' '}
          <a href="mailto:thriftly01store@gmail.com" className="text-zinc-950 underline underline-offset-2">
            thriftly01store@gmail.com
          </a>
        </p>
      </div>
    ),
  },
  {
    title: '7. Data Retention',
    body: (
      <ul className="list-disc list-inside space-y-1">
        <li>Active account data is retained as long as your account exists</li>
        <li>Order and transaction records are retained for 7 years for legal and tax compliance</li>
        <li>
          If you delete your account, your personal data is removed within 30 days except where
          retention is required by law
        </li>
      </ul>
    ),
  },
  {
    title: '8. Cookies',
    body: (
      <p>
        Thriftly uses minimal cookies necessary for the platform to function — specifically for
        keeping you logged in. We do not use advertising or tracking cookies.
      </p>
    ),
  },
  {
    title: "9. Children's Privacy",
    body: (
      <p>
        Thriftly is not intended for users under 18 years of age. We do not knowingly collect
        personal information from anyone under 18. If we discover a user is under 18 their account
        will be suspended immediately.
      </p>
    ),
  },
  {
    title: '10. Changes to This Policy',
    body: (
      <p>
        We may update this Privacy Policy from time to time. We will notify you of significant
        changes via WhatsApp or email. Continued use of the platform after changes means you accept
        the updated policy.
      </p>
    ),
  },
  {
    title: '11. Contact Us',
    body: (
      <div className="space-y-1">
        <p>For privacy related questions or requests:</p>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li>
            Email:{' '}
            <a href="mailto:thriftly01store@gmail.com" className="text-zinc-950 underline underline-offset-2">
              thriftly01store@gmail.com
            </a>
          </li>
          <li>
              WhatsApp:{' '}
              <a
                href="https://wa.me/233596755834"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-950 underline underline-offset-2 hover:text-zinc-700 transition-colors"
              >
                0596755834
              </a>
            </li>
          <li>Website: thriftly01.store</li>
        </ul>
      </div>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white px-4 py-10">
      <div className="max-w-[800px] mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-700 transition-colors duration-200 mb-8"
        >
          <ArrowLeft size={15} />
          Back to home
        </Link>

        <h1 className="text-3xl font-bold text-zinc-950 mb-1">Privacy Policy</h1>
        <p className="text-sm text-zinc-400 mb-1">Effective Date: May 2026</p>
        <p className="text-sm text-zinc-400 mb-10">Platform: Thriftly · Website: thriftly01.store</p>

        <div>
          {sections.map((section, i) => (
            <div key={i}>
              <div className="py-7">
                <h2 className="text-base font-semibold text-zinc-950 mb-3">{section.title}</h2>
                <div className="text-sm text-zinc-600 leading-relaxed">{section.body}</div>
              </div>
              {i < sections.length - 1 && <hr className="border-zinc-100" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
