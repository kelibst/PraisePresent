import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { RootState } from "@/lib/store";
import { selectSettings } from "@/lib/settingsSlice";

/* @ts-ignore */
import logoDark from "../assets/logo-dark.png";
/* @ts-ignore */
import logoLight from "../assets/logo-white.png";

const LiveDisplay: React.FC = () => {
  const settings = useSelector(selectSettings);
  const { liveItem } = useSelector((state: RootState) => state.presentation);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
        delayChildren: 0.2,
        duration: 0.5,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
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
        duration: 0.8,
      },
    },
  };

  const circleVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 0.3,
      transition: {
        delay: 0.5,
        duration: 1.2,
        ease: "easeOut",
      },
    },
  };

  // Listen for IPC messages from main process
  useEffect(() => {
    // Live display is ready to receive content
    console.log("Live display component mounted and ready for content");

    // Content will be managed via Redux store
    // Main process will update the store, and this component will react to changes

    return () => {
      console.log("Live display component unmounting");
    };
  }, []);

  // Determine theme based on settings
  const isDark =
    settings.theme === "dark" ||
    (settings.theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // Format time
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // If there's live content, show it; otherwise show intro
  if (liveItem) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white p-8">
        <div className="max-w-4xl text-center">
          {/* Live content will be rendered here */}
          <div className="text-6xl font-bold mb-8">{liveItem.title}</div>
          {liveItem.content && (
            <div className="text-3xl leading-relaxed whitespace-pre-line">
              {liveItem.content}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default intro screen
  return (
    <motion.div
      className={`flex min-h-screen ${
        isDark
          ? "bg-gradient-to-b from-blue-900 to-purple-900"
          : "bg-gradient-to-b from-blue-500 to-purple-500"
      } text-white relative overflow-hidden`}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Decorative circles */}
      <motion.div
        className="absolute top-0 left-0 w-1/2 h-1/2 rounded-full border-4 border-blue-400 opacity-30"
        style={{ transform: "translate(-30%,-30%)" }}
        variants={circleVariants}
      />
      <motion.div
        className="absolute bottom-0 right-0 w-1/2 h-1/2 rounded-full border-4 border-blue-400 opacity-30"
        style={{ transform: "translate(30%,30%)" }}
        variants={circleVariants}
      />

      {/* Main content */}
      <div className="flex flex-col justify-center items-center w-full relative z-10">
        {/* Logo */}
        <motion.div className="relative mb-8" variants={logoVariants}>
          <motion.img
            src={isDark ? logoLight : logoDark}
            alt="PraisePresent Logo"
            className="w-64 h-64 object-contain rounded-full"
            initial={{ rotate: -5 }}
            animate={{ rotate: 5 }}
            transition={{
              repeat: Infinity,
              repeatType: "reverse",
              duration: 3,
              ease: "easeInOut",
            }}
          />
        </motion.div>

        {/* Welcome text */}
        <motion.h1
          className="text-8xl font-bold mb-4 text-center"
          variants={itemVariants}
        >
          Welcome to Worship
        </motion.h1>

        <motion.p
          className="text-3xl mb-12 opacity-90 text-center max-w-3xl"
          variants={itemVariants}
        >
          Preparing for an amazing time of praise and worship
        </motion.p>

        {/* Time and Date */}
        <motion.div className="text-center space-y-2" variants={itemVariants}>
          <div className="text-5xl font-bold">{formatTime(currentTime)}</div>
          <div className="text-2xl opacity-80">{formatDate(currentTime)}</div>
        </motion.div>

        {/* Live indicator */}
        <motion.div
          className="absolute top-8 right-8 flex items-center gap-3"
          variants={itemVariants}
        >
          <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
          <span className="text-xl font-semibold">LIVE</span>
        </motion.div>

        {/* Church name placeholder */}
        <motion.div
          className="absolute bottom-8 left-8"
          variants={itemVariants}
        >
          <p className="text-xl opacity-75">Your Church Name</p>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default LiveDisplay;
