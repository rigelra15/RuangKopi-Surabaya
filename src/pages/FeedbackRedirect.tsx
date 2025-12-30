import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";

export default function FeedbackRedirect() {
  // Read initial state only once
  const [isDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    if (saved !== null) {
      return JSON.parse(saved);
    }
    return false;
  });

  const [language] = useState<"id" | "en">(() => {
    const saved = localStorage.getItem("language");
    return (saved as "id" | "en") || "id";
  });

  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    // Apply dark mode class for this page's render context
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Countdown and redirect logic
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = "https://forms.gle/wKruzrLKLpCTwxMw6";
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isDarkMode]);

  const text = {
    redirecting:
      language === "id"
        ? "Mengalihkan ke Formulir..."
        : "Redirecting to Feedback Form...",
    pleaseWait:
      language === "id"
        ? `Mohon tunggu ${countdown} detik lagi...`
        : `Please wait ${countdown} seconds...`,
    manualClick:
      language === "id"
        ? "Jika tidak dialihkan secara otomatis,"
        : "If not redirected automatically,",
    clickHere: language === "id" ? "klik di sini" : "click here",
  };

  return (
    <div
      className={`
      flex items-center justify-center min-h-screen px-4
      bg-gradient-to-br from-amber-50 to-orange-50
      dark:from-gray-900 dark:to-gray-800
      transition-colors duration-300
    `}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring" }}
        className={`
          max-w-md w-full p-8 rounded-3xl text-center shadow-xl
          ${
            isDarkMode
              ? "bg-gray-900/80 border border-gray-700 backdrop-blur-md"
              : "bg-white/80 border border-white/50 backdrop-blur-md"
          }
        `}
      >
        {/* Animated Icon */}
        <div className="relative mb-6 mx-auto w-24 h-24 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className={`absolute inset-0 rounded-full border-2 border-dashed ${
              isDarkMode ? "border-primary-500/30" : "border-primary-300"
            }`}
          />
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className={`
              w-16 h-16 rounded-2xl flex items-center justify-center
              ${
                isDarkMode
                  ? "bg-gradient-to-br from-primary-600 to-primary-800 text-white shadow-primary-900/50"
                  : "bg-gradient-to-br from-primary-400 to-primary-600 text-white shadow-primary-200"
              }
              shadow-lg
            `}
          >
            <Icon icon="mdi:message-draw" className="w-8 h-8" />
          </motion.div>
        </div>

        {/* Text Content */}
        <h1
          className={`text-xl font-bold mb-2 ${
            isDarkMode ? "text-white" : "text-gray-800"
          }`}
        >
          {text.redirecting}
        </h1>
        <p
          className={`text-sm mb-8 ${
            isDarkMode ? "text-gray-400" : "text-gray-500"
          }`}
        >
          {text.pleaseWait}
        </p>

        {/* Loading Bar */}
        <div className="h-1.5 w-48 mx-auto bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-6">
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="h-full w-full bg-primary-500 rounded-full"
          />
        </div>

        {/* Manual Link */}
        <p
          className={`text-xs ${
            isDarkMode ? "text-gray-500" : "text-gray-400"
          }`}
        >
          {text.manualClick}{" "}
          <a
            href="https://forms.gle/wKruzrLKLpCTwxMw6"
            className="text-primary-500 hover:underline font-medium"
          >
            {text.clickHere}
          </a>
        </p>
      </motion.div>
    </div>
  );
}
