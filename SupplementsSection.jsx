import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from "framer-motion";
import { Pill, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";

export default function SupplementsSection({ supplements }) {
  const [expanded, setExpanded] = useState(true);

  if (!supplements || supplements.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
    >
      <Card className="border-0 shadow-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setExpanded((p) => !p)}
          className="w-full flex items-center justify-between px-5 py-4 bg-gradient-to-r from-accent/10 to-accent/5 border-b border-accent/10"
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-accent/20 rounded-lg">
              <Pill className="w-4 h-4 text-accent" />
            </div>
            <h2 className="text-base font-bold">💊 Supplement Guide</h2>
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
              <CardContent className="p-4 space-y-3">
                {supplements.map((supp, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="p-4 rounded-xl bg-muted/40 hover:bg-muted transition-colors space-y-2"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{supp.name}</span>
                        {supp.risk_level && (
                          <Badge
                            className={
                              supp.risk_level === "high"
                                ? "bg-destructive/10 text-destructive border-destructive/20"
                                : supp.risk_level === "medium"
                                  ? "bg-orange-100 text-orange-700 border-orange-200"
                                  : "bg-green-100 text-green-700 border-green-200"
                            }
                          >
                            {supp.risk_level} risk
                          </Badge>
                        )}
                      </div>
                      {supp.timing && (
                        <Badge variant="secondary" className="text-xs">
                          {supp.timing}
                        </Badge>
                      )}
                    </div>
                    {supp.benefit && (
                      <p className="text-xs text-muted-foreground">
                        {supp.benefit}
                      </p>
                    )}
                    {supp.dosage && (
                      <p className="text-xs font-medium text-foreground">
                        📏 Dosage: {supp.dosage}
                      </p>
                    )}
                    {supp.warning && (
                      <div className="flex items-start gap-2 p-2 bg-destructive/5 rounded-lg border border-destructive/10">
                        <AlertTriangle className="w-3.5 h-3.5 text-destructive flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-destructive">
                          {supp.warning}
                        </p>
                      </div>
                    )}
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
