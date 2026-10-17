import { IllustrativeBanner } from '@/components/notices/IllustrativeBanner';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <IllustrativeBanner topic="bank account" />
      {children}
    </>
  );
}
