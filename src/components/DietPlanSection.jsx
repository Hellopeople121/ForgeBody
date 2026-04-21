/* eslint-disable no-undef */
// @ts-nocheck
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Apple,
  Coffee,
  Sun,
  Moon,
  ChefHat,
  DollarSign,
  Plus,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const MEAL_ICONS = {
  breakfast: Coffee,
  lunch: Sun,
  dinner: Moon,
  snacks: Apple,
};

function MealCard({ meal, index }) {
  const [showPrep, setShowPrep] = useState(false);
  const Icon = MEAL_ICONS[meal.type && meal.type.toLowerCase()] || Apple;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.08 }}
    >
      <Card className="border-0 shadow-md hover:shadow-lg transition-shadow overflow-hidden">
        <CardContent className="p-0">
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <div className="flex items-center gap-2">
              <Icon className="w-4 h-4 text-accent" />
              <h3 className="font-bold text-sm capitalize">{meal.type}</h3>
            </div>
            <div className="flex items-center gap-2">
              {meal.calories && (
                <Badge
                  variant="default"
                  className="bg-accent/20 text-accent border-accent/30 text-xs"
                >
                  {meal.calories} kcal
                </Badge>
              )}
              {meal.estimated_price && (
                <Badge
                  variant="default"
                  className="bg-green-100 text-green-700 border-green-200 text-xs gap-1"
                >
                  <DollarSign className="w-3 h-3" />
                  {meal.estimated_price}
                </Badge>
              )}
            </div>
          </div>

          <ul className="px-4 pb-3 space-y-1.5">
            {meal.items?.map((item, j) => (
              <li
                key={j}
                className="text-sm text-muted-foreground flex items-start gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-accent/40 mt-1.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>

          {meal.prep_instructions && (
            <>
              <button
                type="button"
                onClick={() => setShowPrep((p) => !p)}
                className="w-full flex items-center gap-2 px-4 py-2.5 bg-muted/50 hover:bg-muted text-xs font-semibold text-muted-foreground transition-colors border-t"
              >
                <ChefHat className="w-3.5 h-3.5 text-accent" />
                {showPrep ? "Hide" : "Show"} Prep Instructions
              </button>
              <AnimatePresence>
                {showPrep && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 py-3 bg-accent/5 border-t border-accent/10">
                      <ol className="space-y-1.5">
                        {meal.prep_instructions.map((step, k) => (
                          <li
                            key={k}
                            className="text-xs text-foreground flex items-start gap-2"
                          >
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent/20 text-accent flex items-center justify-center font-bold text-xs">
                              {k + 1}
                            </span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function CaloriePhotoChecker({ targetCalories }) {
  return (
    <Card className="shadow-md bg-card border border-border">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Apple className="w-4 h-4 text-accent" />
          <h3 className="font-bold text-sm text-foreground">
            🥗 Calorie Target
          </h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Your target calorie intake for this meal is approximately:
        </p>
        <div className="text-center py-2">
          <span className="text-2xl font-bold text-accent">~{targetCalories} kcal</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Try to stay within 10-20% of this target for optimal results.
        </p>
      </CardContent>
    </Card>
  );
}

export default function DietPlanSection({ dietPlan, onGetMoreMeals, loadingMoreMeals, extraMeals }) {
  if (!dietPlan) return null;

  const perMealCalories = dietPlan.daily_calories
    ? Math.round(dietPlan.daily_calories / (dietPlan.meals?.length || 4))
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className="space-y-5"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-accent/10 rounded-xl">
          <Apple className="w-5 h-5 text-accent" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Your Diet Plan</h2>
      </div>

      {/* Macro summary */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.25 }}
        className="flex flex-wrap gap-3"
      >
        {dietPlan.daily_calories && (
          <Badge
            variant="default"
            className="bg-accent/10 text-accent border-accent/20 px-3 py-1.5 text-sm"
          >
            🔥 ~{dietPlan.daily_calories} cal/day
          </Badge>
        )}
        {dietPlan.protein && (
          <Badge variant="secondary" className="px-3 py-1.5 text-sm">
            💪 Protein: {dietPlan.protein}
          </Badge>
        )}
        {dietPlan.carbs && (
          <Badge variant="secondary" className="px-3 py-1.5 text-sm">
            🌾 Carbs: {dietPlan.carbs}
          </Badge>
        )}
        {dietPlan.fats && (
          <Badge variant="secondary" className="px-3 py-1.5 text-sm">
            🥑 Fats: {dietPlan.fats}
          </Badge>
        )}
        {dietPlan.total_weekly_price && (
          <Badge
            variant="default"
            className="bg-green-100 text-green-700 border-green-200 px-3 py-1.5 text-sm gap-1"
          >
            <DollarSign className="w-3.5 h-3.5" />
            Est. Week: {dietPlan.total_weekly_price}
          </Badge>
        )}
      </motion.div>

      {/* Meals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {dietPlan.meals?.map((meal, i) => (
          <MealCard key={i} meal={meal} index={i} />
        ))}
      </div>

      {/* Extra Meals from "Get More" */}
      {extraMeals && extraMeals.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <Plus className="w-4 h-4 text-accent" />
            More Meal Ideas
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {extraMeals.map((meal, i) => (
              <MealCard key={`extra-${i}`} meal={meal} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Get More Meals Button */}
      <div className="flex justify-center pt-2">
        <Button
          onClick={onGetMoreMeals}
          disabled={loadingMoreMeals}
          className="bg-accent/10 text-accent border-accent/30 hover:bg-accent/20"
        >
          {loadingMoreMeals ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Getting more ideas...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Get More Meal Ideas
            </>
          )}
        </Button>
      </div>

      {/* Photo calorie checker */}
      {perMealCalories && (
        <CaloriePhotoChecker targetCalories={perMealCalories} />
      )}

      {/* Tips */}
      {dietPlan.tips && dietPlan.tips.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-0 shadow-md bg-accent/5">
            <CardContent className="p-4">
              <h3 className="font-bold text-sm mb-2">💡 Nutrition Tips</h3>
              <ul className="space-y-1.5">
                {dietPlan.tips.map((tip, i) => (
                  <li
                    key={i}
                    className="text-sm text-muted-foreground flex items-start gap-2"
                  >
                    <span className="text-accent">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
