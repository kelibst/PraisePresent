// Simple Badge component since it's not available
const Badge: React.FC<{
	children: React.ReactNode;
	variant?: 'default' | 'secondary' | 'outline';
	className?: string;
}> = ({ children, variant = 'default', className = '' }) => {
	const baseClasses = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";
	const variantClasses = {
		default: "bg-primary text-primary-foreground",
		secondary: "bg-secondary text-secondary-foreground",
		outline: "border border-input bg-background text-foreground"
	};

	return (
		<span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
			{children}
		</span>
	);
};
export default Badge;