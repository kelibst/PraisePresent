import { FiPlus } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/layout/AnimatedSidebar';

// Import images with correct paths
/* @ts-ignore */
import logoDark from '@/assets/logo-dark.png';
/* @ts-ignore */
import logoLight from '@/assets/logo-white.png';

const Homepage = () => {
	const navigate = useNavigate();
	const [theme, setTheme] = useTheme();
	
	// Animation variants
	const containerVariants = {
		hidden: { opacity: 0 },
		visible: { 
			opacity: 1,
			transition: { 
				staggerChildren: 0.3,
				delayChildren: 0.2,
				duration: 0.5 
			}
		}
	};
	
	const itemVariants = {
		hidden: { opacity: 0, y: 50 },
		visible: { 
			opacity: 1, 
			y: 0,
			transition: { duration: 0.8, ease: "easeOut" }
		}
	};
	
	const logoVariants = {
		hidden: { scale: 0.8, opacity: 0 },
		visible: { 
			scale: 1, 
			opacity: 1,
			transition: { 
				type: "spring",
				stiffness: 100,
				damping: 15,
				duration: 0.8
			}
		}
	};
	
	const circleVariants = {
		hidden: { scale: 0, opacity: 0 },
		visible: { 
			scale: 1, 
			opacity: 0.3,
			transition: { 
				delay: 0.5,
				duration: 1.2, 
				ease: "easeOut"
			}
		}
	};
	
	const buttonVariants = {
		hidden: { opacity: 0, scale: 0.8 },
		visible: { 
			opacity: 1, 
			scale: 1,
			transition: { 
				delay: 1.2,
				duration: 0.5, 
				type: "spring",
				stiffness: 200
			}
		},
		hover: { 
			scale: 1.05,
			boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.1)",
			transition: { 
				duration: 0.3
			}
		}
	};

	return (
		<motion.div 
			className="flex min-h-screen"
			initial="hidden"
			animate="visible"
			variants={containerVariants}
		>
			{/* Centered Content */}
			<div className="flex flex-col justify-center items-center w-full bg-yellow-400 dark:bg-slate-900 text-white relative overflow-hidden">
				{/* Decorative circles */}
				<motion.div 
					className="absolute top-0 left-0 w-1/2 h-1/2 rounded-full border-4 border-blue-400 opacity-30" 
					style={{ transform: 'translate(-30%,-30%)' }}
					variants={circleVariants}
				/>
				<motion.div 
					className="absolute bottom-0 right-0 w-1/2 h-1/2 rounded-full border-4 border-blue-400 opacity-30" 
					style={{ transform: 'translate(30%,30%)' }}
					variants={circleVariants}
				/>
				
				{/* Logo */}
				<motion.div
					className="relative"
					variants={logoVariants}
				>
					<motion.img 
						src={theme === 'dark' ? logoLight : logoDark} 
						alt="PraisePresent Logo" 
						className="w-48 h-48 object-contain rounded-full my-6"
						initial={{ rotate: -5 }}
						animate={{ rotate: 5 }}
						transition={{ 
							repeat: Infinity, 
							repeatType: "reverse", 
							duration: 3,
							ease: "easeInOut"
						}}
					/>
				</motion.div>
				
				{/* Text Elements */}
				<motion.h1 
					className="text-4xl font-bold mb-2 text-center"
					variants={itemVariants}
				>
					PraisePresent
				</motion.h1>
				
				<motion.p 
					className="text-xl mb-10 opacity-90 text-center max-w-md"
					variants={itemVariants}
				>
					Create beautiful worship presentations for your church
				</motion.p>
				
				{/* Button */}
				<motion.div variants={buttonVariants} whileHover="hover">
					<button
						className="flex items-center gap-2 bg-white dark:bg-black  dark:text-white text-black font-semibold px-8 py-4 rounded-full shadow-lg hover:bg-blue-50 transition"
						onClick={() => navigate('/services')}
					>
						<FiPlus /> Start New Service
					</button>
				</motion.div>
			</div>
		</motion.div>
	);
};

export default Homepage; 