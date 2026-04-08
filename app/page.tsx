import ListingsGrid from '@/components/ListingsGrid';
import VerificationGuard from '@/components/VerificationGuard';

export default function HomePage() {
  return (
    <VerificationGuard>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text mb-2">
            Dartmouth Student Marketplace
          </h1>
          <p className="text-text-secondary">
            Buy and sell items within the Dartmouth community
          </p>
        </div>
        
        <ListingsGrid />
      </div>
    </VerificationGuard>
  );
}