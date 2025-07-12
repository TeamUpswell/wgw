// Utility functions for the Going Well app

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const calculateStreak = (
  entries: Array<{ created_at: string }>
): number => {
  if (entries.length === 0) return 0;

  const today = new Date();
  const sortedEntries = entries
    .map((entry) => new Date(entry.created_at))
    .sort((a, b) => b.getTime() - a.getTime());

  let streak = 0;
  let currentDate = new Date(today);

  for (const entryDate of sortedEntries) {
    const entryDay = new Date(
      entryDate.getFullYear(),
      entryDate.getMonth(),
      entryDate.getDate()
    );
    const currentDay = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate()
    );

    if (entryDay.getTime() === currentDay.getTime()) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else if (entryDay.getTime() < currentDay.getTime()) {
      break;
    }
  }

  return streak;
};

export const isToday = (date: string): boolean => {
  const today = new Date();
  const checkDate = new Date(date);
  
  // Get start and end of today in local time
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  
  // Check if the date falls within today's boundaries
  return checkDate >= startOfToday && checkDate < endOfToday;
};

export const getDaysAgo = (date: string): number => {
  const today = new Date();
  const checkDate = new Date(date);
  const diffTime = today.getTime() - checkDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};
