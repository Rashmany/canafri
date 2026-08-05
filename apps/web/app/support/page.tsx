import SupportPage from '@/components/pages/support-page';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Support Center & Help FAQ | CanaFri',
  description: 'Find answers to common questions about accounts, wallets, payments, freelancing, and escrow on CanaFri, or submit a support request.',
};

export default function Page() {
  return <SupportPage />;
}
