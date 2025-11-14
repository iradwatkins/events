"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Gift, Sparkles, Ticket, DollarSign } from "lucide-react";

interface WelcomePopupProps {
  open: boolean;
  onClose: () => void;
  creditsRemaining: number;
}

export function WelcomePopup({ open, onClose, creditsRemaining }: WelcomePopupProps) {
  const creditValue = (creditsRemaining * 0.3).toFixed(2);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold flex items-center justify-center gap-2">
            <Gift className="w-8 h-8 text-primary animate-bounce" />
            Welcome to SteppersLife Events!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Celebration Banner */}
          <div className="bg-gradient-to-r from-primary/10 via-blue-50 to-primary/10 rounded-lg p-6 text-center border-2 border-primary/20">
            <Sparkles className="w-12 h-12 text-primary mx-auto mb-3" />
            <h3 className="text-3xl font-bold text-primary mb-2">
              {creditsRemaining.toLocaleString()} FREE Tickets!
            </h3>
            <p className="text-sm text-gray-600">Worth ${creditValue} to help you get started</p>
          </div>

          {/* What You Get */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
              <Ticket className="w-5 h-5 text-primary" />
              Here's what you can do:
            </h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold mt-0.5">•</span>
                <span>
                  Create your first event completely <strong>FREE</strong>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold mt-0.5">•</span>
                <span>List up to {creditsRemaining.toLocaleString()} tickets at no cost</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold mt-0.5">•</span>
                <span>
                  Collect <strong>100% of ticket sales</strong> revenue
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold mt-0.5">•</span>
                <span>Try out all our features risk-free</span>
              </li>
            </ul>
          </div>

          {/* How Credits Work */}
          <div className="bg-accent rounded-lg p-4 border border-primary/30">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-primary" />
              How Free Tickets Work:
            </h4>
            <p className="text-sm text-gray-700 leading-relaxed">
              Your free tickets will be automatically applied when you create an event. Once used,
              you can purchase more tickets at just <strong>$0.30 each</strong> to continue hosting
              events with zero transaction fees.
            </p>
          </div>

          {/* CTA Button */}
          <Button
            onClick={onClose}
            className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-6 text-lg"
          >
            Get Started - Create My Event
          </Button>

          <p className="text-xs text-center text-gray-500">
            Your free tickets never expire and are ready to use anytime!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
