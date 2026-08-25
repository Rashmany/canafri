import TermsPage from '@/components/pages/terms-page';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms & Conditions | CanaFri',
  description: 'Read the Terms and Conditions governing use of the CanaFri platform, freelancing services, and escrow smart contracts.',
};

export default function Page() {
  return <TermsPage />;
}
