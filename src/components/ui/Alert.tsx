// Simple Alert component since it's not available
const Alert: React.FC<{
  children: React.ReactNode;
  variant?: "default" | "destructive";
  className?: string;
}> = ({ children, variant = "default", className = "" }) => {
  const baseClasses = "relative w-full rounded-lg border p-4";
  const variantClasses = {
    default: "border-border bg-background",
    destructive:
      "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  );
};

const AlertDescription: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <div className={`text-sm ${className}`}>{children}</div>
);
export { Alert, AlertDescription };
