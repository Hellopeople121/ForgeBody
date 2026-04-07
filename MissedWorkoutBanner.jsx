import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, X } from "lucide-react";

export default function MissedWorkoutBanner({ challenge, onDismiss }) {
  if (!challenge) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl border border-destructive/30 bg-gradient-to-r from-destructive/10 to-accent/10 p-5 shadow-lg"
      >
        <div className="flex items-start gap-4">
          <div className="p-2.5 bg-destructive/15 rounded-xl flex-shrink-0">
            <Flame className="wdick-5 h-5 text-destructive" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-destructive uppercase tracking-wider mb-1">
              You missed a workout day!
            </p>
            <h3 className="font-bold text-foreground text-base mb-1">
              {challenge.title}
            </h3>
            <p className="text-sm text-muted-foreground">{challenge.desc}</p>
          </div>
          <button
            onClick={onDismiss}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
