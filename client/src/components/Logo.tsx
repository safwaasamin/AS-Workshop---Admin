export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="text-primary-600 flex items-center justify-center bg-primary-100 rounded-md p-1 h-8 w-8">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
          <path d="M6 12v5c0 2 1 3 3 3h6c2 0 3-1 3-3v-5"></path>
        </svg>
      </div>
      <span className="font-bold text-lg text-primary-600 tracking-wide">EDUMIN</span>
    </div>
  );
}