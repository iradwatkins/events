"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface TierCountdownProps {
  endDate: number;
  className?: string;
}

export function TierCountdown({ endDate, className = "" }: TierCountdownProps) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(endDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(endDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  if (timeLeft.expired) {
    return (
      <div className={`flex items-center gap-1 text-red-600 ${className}`}>
        <Clock className="w-4 h-4" />
        <span className="text-sm font-medium">Expired</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Clock className="w-4 h-4 text-orange-600" />
      <div className="flex items-center gap-1 text-sm font-medium">
        {timeLeft.days > 0 && <span className="text-gray-900">{timeLeft.days}d </span>}
        {(timeLeft.days > 0 || timeLeft.hours > 0) && (
          <span className="text-gray-900">{timeLeft.hours}h </span>
        )}
        <span className="text-gray-900">{timeLeft.minutes}m </span>
        <span className="text-orange-600">{timeLeft.seconds}s</span>
        <span className="text-gray-600 ml-1">left</span>
      </div>
    </div>
  );
}

function calculateTimeLeft(endDate: number) {
  const now = Date.now();
  const difference = endDate - now;

  if (difference <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      expired: true,
    };
  }

  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((difference % (1000 * 60)) / 1000);

  return {
    days,
    hours,
    minutes,
    seconds,
    expired: false,
  };
}

interface TierAvailabilityBadgeProps {
  saleStart?: number;
  saleEnd?: number;
  sold: number;
  quantity: number;
}

export function TierAvailabilityBadge({
  saleStart,
  saleEnd,
  sold,
  quantity,
}: TierAvailabilityBadgeProps) {
  const now = Date.now();
  const isSoldOut = sold >= quantity;
  const isNotStarted = saleStart && now < saleStart;
  const isExpired = saleEnd && now > saleEnd;
  const isActive = !isSoldOut && !isNotStarted && !isExpired;

  if (isSoldOut) {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        Sold Out
      </span>
    );
  }

  if (isNotStarted) {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-accent text-accent-foreground">
        Coming Soon
      </span>
    );
  }

  if (isExpired) {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
        Expired
      </span>
    );
  }

  if (isActive && saleEnd && saleEnd - now < 24 * 60 * 60 * 1000) {
    // Less than 24 hours left
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 animate-pulse">
        Ending Soon!
      </span>
    );
  }

  if (isActive && saleEnd) {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Early Bird
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
      Available
    </span>
  );
}
