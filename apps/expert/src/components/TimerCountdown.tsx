import React, { useEffect, useState } from "react";

interface TimerProps {
  initialTimeLeft: number;
}

const TimerCountdown: React.FC<TimerProps> = ({ initialTimeLeft }) => {
  const [timeLeft, setTimeLeft] = useState(initialTimeLeft);

  // Function to format milliseconds to HH:MM format
  const formatMillisecondsToHHMM = (milliseconds: number) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  useEffect(() => {
    if (timeLeft <= 0) return;

    // Set up an interval to update the time every second
    const intervalId = setInterval(() => {
      setTimeLeft((prevTimeLeft) => prevTimeLeft - 1000);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timeLeft]);

  return (
    <div>
      <h2>{formatMillisecondsToHHMM(timeLeft)}</h2>
    </div>
  );
};

export default TimerCountdown;
