import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Flame,
  Repeat,
  Play,
  X,
  ChevronDown,
  ChevronUp,
  Zap,
  Moon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function WorkoutCard({ day, exercises, index, caloriesBurned, recoveryTip }) {
  const [expanded, setExpanded] = useState(true);
  const [videoExercise, setVideoExercise] = useState(null);

  const isRestDay = !exercises || exercises.length === 0;

  const getYouTubeSearchUrl = (exerciseName) => {
    const query = encodeURIComponent(
      `${exerciseName} exercise tutorial proper form`,
    );
    return `https://www.youtube.com/results?search_query=${query}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
    >
      <Card className={`border-0 shadow-lg shadow-primary/5 hover:shadow-xl transition-shadow duration-300 overflow-hidden ${isRestDay ? 'bg-indigo-50/50' : ''}`}>
        <button
          type="button"
          onClick={() => setExpanded((p) => !p)}
          className={`w-full px-5 py-3 border-b flex items-center justify-between ${isRestDay ? 'bg-indigo-50/50 border-indigo-100' : 'bg-gradient-to-r from-primary/10 to-primary/5 border-primary/10'}`}
        >
          <div className="flex items-center gap-2">
            <h3 className={`font-bold text-left ${isRestDay ? 'text-indigo-600' : 'text-foreground'}`}>{day}</h3>
            {isRestDay ? (
              <Badge className="bg-indigo-100 text-indigo-600 border-indigo-200 gap-1 text-xs">
                <Moon className="w-3 h-3" /> Rest Day
              </Badge>
            ) : caloriesBurned ? (
              <Badge className="bg-destructive/10 text-destructive border-destructive/20 gap-1 text-xs">
                <Flame className="w-3 h-3" />~{caloriesBurned} kcal
              </Badge>
            ) : null}
          </div>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
            >
              <CardContent className="p-4 space-y-2">
                {isRestDay ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Moon className="w-8 h-8 mx-auto mb-2 text-indigo-300" />
                    <p className="italic">{recoveryTip || "Rest and recover today. Focus on sleep, hydration, and light stretching."}</p>
                  </div>
                ) : exercises?.map((ex, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-start justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors gap-2"
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <p className="font-semibold text-sm">{ex.name}</p>
                      {ex.note && (
                        <p className="text-xs text-muted-foreground">
                          {ex.note}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
                      {ex.sets && (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <Repeat className="w-3 h-3" />
                          {ex.sets}
                        </Badge>
                      )}
                      {ex.reps && (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <Zap className="w-3 h-3" />
                          {ex.reps}
                        </Badge>
                      )}
                      {ex.duration && (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <Clock className="w-3 h-3" />
                          {ex.duration}
                        </Badge>
                      )}
                      <a
                        href={getYouTubeSearchUrl(ex.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2 py-1 rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-xs font-medium"
                        title="Watch tutorial"
                      >
                        <Play className="w-3 h-3" />
                        Video
                      </a>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
