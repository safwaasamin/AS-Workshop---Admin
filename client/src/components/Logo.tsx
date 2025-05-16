import logoSVG from "@/assets/logo.svg";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img src={logoSVG} alt="AspiraSys Logo" className="h-9" />
    </div>
  );
}