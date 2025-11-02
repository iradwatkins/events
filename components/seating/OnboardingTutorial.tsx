/**
 * Onboarding Tutorial Overlay
 * Interactive walkthrough for first-time users
 */

"use client";

import React, { useState, useEffect } from "react";
import { X, ChevronRight, ChevronLeft, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TutorialStep {
  title: string;
  description: string;
  targetSelector?: string;
  position?: "top" | "bottom" | "left" | "right" | "center";
  emoji?: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: "Welcome to Seating Designer! 💃",
    description: "Let's take a quick tour of how to create your ballroom seating chart. This will only take 30 seconds!",
    position: "center",
    emoji: "👋",
  },
  {
    title: "Tool Palette",
    description: "Use keyboard shortcuts to quickly switch tools: V (Select), T (Round Table), R (Rectangle), Q (Square), H (Pan). Or click the icons!",
    targetSelector: ".tool-palette",
    position: "right",
    emoji: "🛠️",
  },
  {
    title: "Add Tables",
    description: "Click on the canvas to place tables. You can drag them around to reposition. Hover over a table to see the delete button.",
    position: "center",
    emoji: "🪑",
  },
  {
    title: "Properties Panel",
    description: "Select a table to edit its properties: number of seats, table shape, rotation, and more!",
    position: "center",
    emoji: "⚙️",
  },
  {
    title: "Save Templates",
    description: "Created the perfect layout? Save it as a template to reuse for future events!",
    position: "center",
    emoji: "💾",
  },
  {
    title: "You're All Set!",
    description: "You're ready to create amazing seating charts. Need help? Hover over any element for tooltips!",
    position: "center",
    emoji: "🎉",
  },
];

interface OnboardingTutorialProps {
  onComplete: () => void;
  onSkip: () => void;
}

export default function OnboardingTutorial({ onComplete, onSkip }: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    onComplete();
  };

  const handleSkipTutorial = () => {
    setIsVisible(false);
    onSkip();
  };

  const step = TUTORIAL_STEPS[currentStep];
  const progress = ((currentStep + 1) / TUTORIAL_STEPS.length) * 100;

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleSkipTutorial();
      } else if (e.key === "ArrowRight" || e.key === "Enter") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrevious();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentStep]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999]">
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={handleSkipTutorial}
        />

        {/* Tutorial Card */}
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ type: "spring", damping: 20 }}
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
          >
            {/* Header with Gradient */}
            <div className="seating-header-gradient p-6 relative">
              <button
                onClick={handleSkipTutorial}
                className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
                title="Skip tutorial (Esc)"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="text-center">
                <div className="text-5xl mb-3">{step.emoji}</div>
                <h2 className="text-2xl font-bold mb-1">{step.title}</h2>
                <p className="text-white/90 text-sm">
                  Step {currentStep + 1} of {TUTORIAL_STEPS.length}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-gray-100">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
                className="h-full bg-gradient-to-r from-purple-600 to-blue-600"
              />
            </div>

            {/* Content */}
            <div className="p-8">
              <p className="text-gray-700 text-lg leading-relaxed mb-6">
                {step.description}
              </p>

              {/* Keyboard Shortcuts Hint */}
              {currentStep === 1 && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                  <p className="text-sm font-semibold text-purple-900 mb-2">Keyboard Shortcuts:</p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-purple-800">
                    <div className="flex items-center gap-2">
                      <kbd className="px-2 py-1 bg-white border border-purple-300 rounded font-mono">V</kbd>
                      <span>Select</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <kbd className="px-2 py-1 bg-white border border-purple-300 rounded font-mono">T</kbd>
                      <span>Round Table</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <kbd className="px-2 py-1 bg-white border border-purple-300 rounded font-mono">R</kbd>
                      <span>Rectangle</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <kbd className="px-2 py-1 bg-white border border-purple-300 rounded font-mono">H</kbd>
                      <span>Pan</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between gap-4">
                <button
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                  className="seating-btn seating-btn-secondary seating-btn-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                <div className="flex gap-1.5">
                  {TUTORIAL_STEPS.map((_, index) => (
                    <div
                      key={index}
                      className={`h-2 w-2 rounded-full transition-all ${
                        index === currentStep
                          ? "bg-purple-600 w-6"
                          : index < currentStep
                          ? "bg-purple-400"
                          : "bg-gray-300"
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={handleNext}
                  className="seating-btn seating-btn-primary seating-btn-sm flex items-center gap-2"
                >
                  {currentStep === TUTORIAL_STEPS.length - 1 ? (
                    <>
                      Got it!
                      <Check className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Skip Link */}
              <div className="mt-4 text-center">
                <button
                  onClick={handleSkipTutorial}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors underline"
                >
                  Skip tutorial
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}

/**
 * Hook to manage tutorial state in localStorage
 */
export function useOnboardingTutorial(key: string = "seating-tutorial-completed") {
  const [shouldShowTutorial, setShouldShowTutorial] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(key);
    if (!completed) {
      setShouldShowTutorial(true);
    }
  }, [key]);

  const markTutorialComplete = () => {
    localStorage.setItem(key, "true");
    setShouldShowTutorial(false);
  };

  const resetTutorial = () => {
    localStorage.removeItem(key);
    setShouldShowTutorial(true);
  };

  return {
    shouldShowTutorial,
    markTutorialComplete,
    resetTutorial,
  };
}
