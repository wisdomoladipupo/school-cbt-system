"use client";

import React, { forwardRef, useImperativeHandle, useState, useEffect } from "react";

interface TimerProps {
  minutes: number;
  onExpire?: () => void;
}

export interface TimerHandle {
  start: () => void;
  pause: () => void;
  reset: () => void;
}

const Timer = forwardRef<TimerHandle, TimerProps>(({ minutes, onExpire }, ref) => {
  const [secondsLeft, setSecondsLeft] = useState(() => minutes * 60);
  const [running, setRunning] = useState(false);

  // Expose imperative methods
  useImperativeHandle(ref, () => ({
    start: () => setRunning(true),
    pause: () => setRunning(false),
    reset: () => setSecondsLeft(minutes * 60),
  }));

  // Countdown logic
  useEffect(() => {
    if (!running) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setRunning(false);
          onExpire?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [running, onExpire]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  return (
    <div className="px-3 py-2 border rounded flex items-center gap-2 bg-white">
      <span className="font-medium">
        {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
      </span>
    </div>
  );
});

Timer.displayName = "Timer";

export default Timer;
