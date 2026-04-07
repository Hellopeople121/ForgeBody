// @ts-nocheck
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dumbbell,
  ArrowRight,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FITNESS_LEVELS = [
  { value: "beginner", label: "🟢 Beginner – Just starting out" },
  { value: "intermediate", label: "🟡 Intermediate – Some experience" },
  { value: "advanced", label: "🟠 Advanced – Experienced lifter" },
  { value: "master", label: "🔴 Master – Elite level athlete" },
];

const GOALS = [
  { value: "lose_weight", label: "Lose Weight" },
  { value: "build_muscle", label: "Build Muscle" },
  { value: "improve_endurance", label: "Improve Endurance" },
  { value: "increase_flexibility", label: "Increase Flexibility" },
  { value: "general_fitness", label: "General Fitness" },
];

const DAYS_OPTIONS = [
  { value: "3", label: "3 days/week" },
  { value: "4", label: "4 days/week" },
  { value: "5", label: "5 days/week" },
  { value: "6", label: "6 days/week" },
];

const DIET_TYPES = [
  { value: "omnivore", label: "🍗 Omnivore – I eat everything" },
  { value: "vegetarian", label: "🥗 Vegetarian – No meat/fish" },
  { value: "vegan", label: "🌱 Vegan – No animal products" },
];

const COMMON_ALLERGIES = [
  "Gluten",
  "Dairy",
  "Nuts",
  "Peanuts",
  "Eggs",
  "Soy",
  "Shellfish",
  "Fish",
];

const SUPPLEMENTS = [
  "Creatine",
  "Protein Powder",
  "Pre-Workout",
  "BCAAs",
  "Steroids",
  "HGH",
  "Beta-Alanine",
  "Caffeine",
  "Fish Oil",
  "Multivitamin",
];

const EQUIPMENT_OPTIONS = [
  "Dumbbells",
  "Barbell & Plates",
  "Pull-up Bar",
  "Resistance Bands",
  "Bench",
  "Squat Rack",
  "Kettlebells",
  "Cable Machine",
  "Treadmill",
  "None (Bodyweight Only)",
];

const SECTION_ANIM = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: "auto" },
  exit: { opacity: 0, height: 0 },
  transition: { duration: 0.3 },
};

export default function OnboardingForm({ onSubmit, isLoading }) {
  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "",
    fitnessLevel: "",
    goal: "",
    daysPerWeek: "",
    wantsDietPlan: false,
    dietType: "",
    allergies: [],
    otherAllergies: "",
    supplements: [],
    usesSupplements: false,
    equipment: [],
    wantsEquipmentPlan: false,
  });
  const [ageError, setAgeError] = useState("");

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "age") {
      const numAge = parseInt(value);
      if (value && (isNaN(numAge) || numAge < 10)) {
        setAgeError("You must be at least 10 years old to use this app.");
      } else {
        setAgeError("");
      }
    }
  };

  const toggleItem = (field, item) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter((a) => a !== item)
        : [...prev[field], item],
    }));
  };

  const isAdvanced = ["advanced", "master"].includes(form.fitnessLevel);

  const isValid =
    form.name.trim() &&
    form.age &&
    !ageError &&
    parseInt(form.age) >= 10 &&
    form.gender &&
    form.fitnessLevel &&
    form.goal &&
    form.daysPerWeek &&
    form.dietType;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isValid) onSubmit(form);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-0 shadow-2xl shadow-primary/10 overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-primary/80 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <Dumbbell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Tell us about yourself
              </h2>
              <p className="text-white/70 text-sm">
                We'll create a plan just for you
              </p>
            </div>
          </div>
        </div>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name & Age */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  placeholder="Enter your name"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  min="10"
                  placeholder="Your age"
                  value={form.age}
                  onChange={(e) => handleChange("age", e.target.value)}
                />
                {ageError && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-destructive text-xs flex items-center gap-1"
                  >
                    <AlertCircle className="w-3 h-3" />
                    {ageError}
                  </motion.p>
                )}
              </div>
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select
                value={form.gender}
                onValueChange={(v) => handleChange("gender", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Fitness Level */}
            <div className="space-y-2">
              <Label>Fitness Level</Label>
              <Select
                value={form.fitnessLevel}
                onValueChange={(v) => handleChange("fitnessLevel", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your level" />
                </SelectTrigger>
                <SelectContent>
                  {FITNESS_LEVELS.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Goal */}
            <div className="space-y-2">
              <Label>Your Goal</Label>
              <Select
                value={form.goal}
                onValueChange={(v) => handleChange("goal", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="What do you want to achieve?" />
                </SelectTrigger>
                <SelectContent>
                  {GOALS.map((g) => (
                    <SelectItem key={g.value} value={g.value}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Days per week */}
            <div className="space-y-2">
              <Label>Workout Days per Week</Label>
              <Select
                value={form.daysPerWeek}
                onValueChange={(v) => handleChange("daysPerWeek", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="How often can you train?" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OPTIONS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Equipment */}
            <div className="space-y-2">
              <Label>Available Equipment</Label>
              <p className="text-xs text-muted-foreground">
                Select all equipment you have access to
              </p>
              <div className="flex flex-wrap gap-2">
                {EQUIPMENT_OPTIONS.map((eq) => (
                  <button
                    key={eq}
                    type="button"
                    onClick={() => toggleItem("equipment", eq)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      form.equipment.includes(eq)
                        ? "bg-primary/10 text-primary border-primary/30 shadow-sm"
                        : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                    }`}
                  >
                    {eq}
                  </button>
                ))}
              </div>
            </div>

            {/* Ask about updating plan for equipment */}
            <AnimatePresence>
              {form.equipment.length > 0 &&
                !form.equipment.includes("None (Bodyweight Only)") && (
                  <motion.div {...SECTION_ANIM}>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/20">
                      <div>
                        <p className="font-semibold text-sm">
                          Optimize Workout for Your Equipment?
                        </p>
                        <p className="text-muted-foreground text-xs">
                          Tailor exercises specifically to what you have
                        </p>
                      </div>
                      <Switch
                        checked={form.wantsEquipmentPlan}
                        onCheckedChange={(v) =>
                          handleChange("wantsEquipmentPlan", v)
                        }
                      />
                    </div>
                  </motion.div>
                )}
            </AnimatePresence>

            {/* Diet Type */}
            <div className="space-y-2">
              <Label>Diet Type</Label>
              <Select
                value={form.dietType}
                onValueChange={(v) => handleChange("dietType", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="What do you eat?" />
                </SelectTrigger>
                <SelectContent>
                  {DIET_TYPES.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Allergies */}
            <div className="space-y-2">
              <Label>Allergies / Intolerances</Label>
              <div className="flex flex-wrap gap-2">
                {COMMON_ALLERGIES.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => toggleItem("allergies", a)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      form.allergies.includes(a)
                        ? "bg-destructive/10 text-destructive border-destructive/30"
                        : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
              <Input
                placeholder="Other allergies (e.g. sesame, mustard...)"
                value={form.otherAllergies}
                onChange={(e) => handleChange("otherAllergies", e.target.value)}
                className="mt-2"
              />
            </div>

            {/* Supplements (shown for advanced/master) */}
            <AnimatePresence>
              {isAdvanced && (
                <motion.div {...SECTION_ANIM} className="space-y-3">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-accent/10 border border-accent/20">
                    <div>
                      <p className="font-semibold text-sm">
                        💊 Using Supplements?
                      </p>
                      <p className="text-muted-foreground text-xs">
                        We'll adjust your plan accordingly
                      </p>
                    </div>
                    <Switch
                      checked={form.usesSupplements}
                      onCheckedChange={(v) =>
                        handleChange("usesSupplements", v)
                      }
                    />
                  </div>
                  <AnimatePresence>
                    {form.usesSupplements && (
                      <motion.div {...SECTION_ANIM} className="space-y-2">
                        <Label>Select Your Supplements</Label>
                        <div className="flex flex-wrap gap-2">
                          {SUPPLEMENTS.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => toggleItem("supplements", s)}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                                form.supplements.includes(s)
                                  ? "bg-accent/20 text-accent border-accent/40 shadow-sm"
                                  : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Diet Plan toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-accent/10 border border-accent/20">
              <div>
                <p className="font-semibold text-sm">
                  🍽️ Personalized Diet Plan
                </p>
                <p className="text-muted-foreground text-xs">
                  Meal prep, recipes, calories & shopping prices
                </p>
              </div>
              <Switch
                checked={form.wantsDietPlan}
                onCheckedChange={(v) => handleChange("wantsDietPlan", v)}
              />
            </div>

            <Button
              type="submit"
              disabled={!isValid || isLoading}
              className="w-full h-12 text-base font-semibold gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Generate My Plan
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
