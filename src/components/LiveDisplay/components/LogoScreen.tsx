import React from "react";

const LogoScreen: React.FC = () => {
	return (
		<div className="w-screen h-screen bg-gradient-to-br from-blue-800 to-blue-500 flex items-center justify-center">
			<div className="text-center text-white">
				<div
					className="text-8xl mb-8 drop-shadow-lg"
					style={{ textShadow: "0 4px 8px rgba(0, 0, 0, 0.3)" }}
				>
					✝️
				</div>
				<h2
					className="text-6xl font-light opacity-90"
					style={{ textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)" }}
				>
					Church Name
				</h2>
			</div>
		</div>
	);
};

export default LogoScreen; 