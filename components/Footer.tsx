export default function Footer() {
  return (
    <footer className="bg-surface border-t border-border py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs text-text-secondary">
          Questions, bugs, or feedback? Contact us at{' '}
          <a 
            href="mailto:support.dartswap@gmail.com" 
            className="hover:text-text transition-colors"
          >
            support.dartswap@gmail.com
          </a>
        </p>
      </div>
    </footer>
  );
}
