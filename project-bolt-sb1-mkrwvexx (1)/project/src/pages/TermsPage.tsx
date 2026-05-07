import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const sections: { title: string; body: React.ReactNode }[] = [
  {
    title: 'Introduction',
    body: (
      <p>
        Welcome to Thriftly. By accessing or using our platform, you agree to be bound by these
        Terms and Conditions. Thriftly is an online marketplace that connects second-hand clothing
        sellers with buyers across Ghana. We do not own, sell, or ship any items listed on the
        platform.
      </p>
    ),
  },
  {
    title: 'Definitions',
    body: (
      <ul className="list-disc list-inside space-y-1">
        <li><span className="font-medium text-zinc-700">"Platform"</span> means the Thriftly website at thriftly01.store.</li>
        <li><span className="font-medium text-zinc-700">"Seller"</span> means any registered user who lists items for sale.</li>
        <li><span className="font-medium text-zinc-700">"Buyer"</span> means any registered user who purchases items.</li>
        <li><span className="font-medium text-zinc-700">"Listing"</span> means any item posted for sale by a Seller.</li>
        <li><span className="font-medium text-zinc-700">"Order"</span> means a completed transaction between a Buyer and Seller.</li>
        <li><span className="font-medium text-zinc-700">"We/Us/Our"</span> means Thriftly and its operators.</li>
      </ul>
    ),
  },
  {
    title: '3. Eligibility',
    body: (
      <div>
        <p className="mb-2">To use Thriftly you must:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Be at least 18 years old</li>
          <li>Have a valid Mobile Money account registered in Ghana</li>
          <li>Provide accurate and truthful information during registration</li>
          <li>Have a working smartphone with internet access</li>
        </ul>
      </div>
    ),
  },
  {
    title: '4. Account Registration',
    body: (
      <ul className="list-disc list-inside space-y-1">
        <li>You may register as a Buyer or Seller</li>
        <li>You are responsible for keeping your account credentials secure</li>
        <li>You may not create multiple accounts</li>
        <li>We reserve the right to suspend or terminate accounts that violate these terms</li>
        <li>One account per Mobile Money number is permitted</li>
      </ul>
    ),
  },
  {
    title: '5. Seller Terms',
    body: (
      <div className="space-y-3">
        <p>By registering as a Seller you agree to:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Only list items you legally own and have the right to sell</li>
          <li>Provide accurate photos and descriptions of every item</li>
          <li>Set fair and honest prices</li>
          <li>Complete every order you receive — failure to fulfil orders may result in account suspension</li>
          <li>Package items securely before dispatch</li>
          <li>Scan the QR code on your order to confirm dispatch before sending</li>
          <li>Respond to buyer messages within 24 hours</li>
          <li>Not list prohibited items (see Section 9)</li>
        </ul>
        <p>
          <span className="font-medium text-zinc-700">Commission:</span> Thriftly charges a 15%
          platform fee on every sale. You receive 85% of the sale price. This is deducted
          automatically before your payout is processed.
        </p>
      </div>
    ),
  },
  {
    title: '6. Buyer Terms',
    body: (
      <div>
        <p className="mb-2">By registering as a Buyer you agree to:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Only purchase items you genuinely intend to buy</li>
          <li>Provide accurate delivery information at checkout</li>
          <li>Pay the full listed price including any delivery fees</li>
          <li>Scan the QR code on received packages to confirm delivery</li>
          <li>Raise disputes within 24 hours of delivery confirmation</li>
          <li>Not abuse the dispute or refund process</li>
        </ul>
      </div>
    ),
  },
  {
    title: '7. Payments',
    body: (
      <ul className="list-disc list-inside space-y-1">
        <li>All payments on Thriftly are processed via Paystack</li>
        <li>Accepted payment method: Mobile Money (MTN, Telecel, AirtelTigo)</li>
        <li>All transactions are in Ghana Cedis (GHS)</li>
        <li>Payments are non-reversible once confirmed except in valid dispute cases</li>
        <li>Thriftly does not store your Mobile Money PIN or financial credentials</li>
        <li>Seller payouts are processed within 1–3 business days after order delivery is confirmed</li>
      </ul>
    ),
  },
  {
    title: '8. Delivery',
    body: (
      <div className="space-y-3">
        <p>All items are delivered by the Seller to the Buyer's provided address. Thriftly is not responsible for items lost or damaged during delivery.</p>
        <p>Delivery is confirmed via the QR code scanning system:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Seller scans QR before dispatch — marks order as Shipped</li>
          <li>Buyer scans QR on receiving package — marks order as Delivered</li>
        </ul>
        <p>Delivery timeframes depend on the Seller and are not guaranteed by Thriftly.</p>
      </div>
    ),
  },
  {
    title: '9. Prohibited Items',
    body: (
      <div className="space-y-3">
        <p>The following items are strictly prohibited on Thriftly:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Counterfeit or fake branded goods</li>
          <li>Stolen items</li>
          <li>Undergarments (for hygiene reasons)</li>
          <li>Items with hate speech, drug references, or offensive imagery</li>
          <li>Weapons of any kind</li>
          <li>Items that violate any Ghana law</li>
        </ul>
        <p>
          Listings found to contain prohibited items will be removed immediately and the seller's
          account may be permanently suspended.
        </p>
      </div>
    ),
  },
  {
    title: '10. Disputes and Refunds',
    body: (
      <div className="space-y-3">
        <ul className="list-disc list-inside space-y-1">
          <li>Buyers must raise disputes within 24 hours of scanning the delivery QR code</li>
          <li>Disputes are raised by contacting Thriftly via WhatsApp or email</li>
          <li>Thriftly will investigate using order records, QR scan timestamps, and message history</li>
          <li>Resolution will be provided within 72 hours of dispute being raised</li>
          <li>Refunds are only issued if the item received is significantly different from the listing photos</li>
        </ul>
        <p>Refunds are <span className="font-medium text-zinc-700">not</span> issued for:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Change of mind</li>
          <li>Sizing issues where measurements were provided in the listing</li>
          <li>Minor variations in colour due to photography lighting</li>
        </ul>
      </div>
    ),
  },
  {
    title: '11. Reviews and Ratings',
    body: (
      <ul className="list-disc list-inside space-y-1">
        <li>Buyers may leave a review after every completed order</li>
        <li>Reviews must be honest and based on genuine experience</li>
        <li>Thriftly does not allow sellers to delete reviews</li>
        <li>Fake or malicious reviews may be removed at Thriftly's discretion</li>
      </ul>
    ),
  },
  {
    title: '12. Account Suspension and Termination',
    body: (
      <div>
        <p className="mb-2">Thriftly reserves the right to suspend or permanently ban any account that:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Violates these Terms and Conditions</li>
          <li>Lists prohibited items</li>
          <li>Engages in fraudulent activity</li>
          <li>Fails to fulfil orders repeatedly</li>
          <li>Abuses the dispute or refund system</li>
          <li>Harasses other users</li>
        </ul>
      </div>
    ),
  },
  {
    title: '13. Limitation of Liability',
    body: (
      <ul className="list-disc list-inside space-y-1">
        <li>Thriftly is a marketplace platform — we are not a party to transactions between Buyers and Sellers</li>
        <li>We are not liable for the quality, safety, or legality of items listed</li>
        <li>We are not liable for delivery failures or disputes between users</li>
        <li>Our maximum liability in any situation is limited to the platform fee collected on the relevant transaction</li>
      </ul>
    ),
  },
  {
    title: '14. Privacy',
    body: (
      <div className="space-y-2">
        <ul className="list-disc list-inside space-y-1">
          <li>We collect your name, email, phone number, and Mobile Money details to operate the platform</li>
          <li>Your data is stored securely on Supabase servers</li>
          <li>We share necessary payment data with Paystack to process transactions</li>
          <li>We do not sell your personal data to third parties</li>
        </ul>
        <p>
          Full details are in our{' '}
          <Link to="/privacy" className="text-zinc-950 underline underline-offset-2 hover:text-zinc-700 transition-colors">
            Privacy Policy
          </Link>
          {' '}at thriftly01.store/privacy.
        </p>
      </div>
    ),
  },
  {
    title: '15. Changes to Terms',
    body: (
      <ul className="list-disc list-inside space-y-1">
        <li>We may update these Terms and Conditions at any time</li>
        <li>We will notify users of significant changes via WhatsApp or email</li>
        <li>Continued use of the platform after changes means you accept the new terms</li>
      </ul>
    ),
  },
  {
    title: '16. Governing Law',
    body: (
      <p>
        These Terms and Conditions are governed by the laws of the Republic of Ghana. Any disputes
        arising from use of the platform shall be resolved under Ghanaian law.
      </p>
    ),
  },
  {
    title: '17. Contact Us',
    body: (
      <div>
        <p className="mb-2">For questions, disputes, or support:</p>
        <ul className="list-disc list-inside space-y-1">
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
          <li>
            Email:{' '}
            <a
              href="mailto:thriftly01store@gmail.com"
              className="text-zinc-950 underline underline-offset-2 hover:text-zinc-700 transition-colors"
            >
              thriftly01store@gmail.com
            </a>
          </li>
          <li>Website: thriftly01.store</li>
        </ul>
      </div>
    ),
  },
];

export default function TermsPage() {
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

        <h1 className="text-3xl font-bold text-zinc-950 mb-1">Terms and Conditions</h1>
        <div className="text-sm text-zinc-400 mb-10 space-y-0.5">
          <p>Effective Date: May 2026</p>
          <p>Platform: Thriftly · Website: thriftly01.store</p>
          <p>Governing Law: Republic of Ghana</p>
        </div>

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
