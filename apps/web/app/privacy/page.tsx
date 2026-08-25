import PrivacyPolicyPage from '@/components/pages/privacy-policy-page';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | CanaFri',
  description: 'Understand how CanaFri collects, uses, and protects your personal data when using the CanaFri platform and services.',
};

export default function Page() {
  return <PrivacyPolicyPage />;
}
