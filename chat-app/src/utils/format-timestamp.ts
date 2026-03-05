export function formatMessageTimestamp(timestamp: number): string {
  const now = new Date();
  const messageDate = new Date(timestamp);
  
  // Check if it's today
  const isToday = 
    messageDate.getDate() === now.getDate() &&
    messageDate.getMonth() === now.getMonth() &&
    messageDate.getFullYear() === now.getFullYear();
  
  // Check if it's this year
  const isThisYear = messageDate.getFullYear() === now.getFullYear();
  
  // Format time
  const time = messageDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  
  if (isToday) {
    // Today: Show time only (2:34 PM)
    return time;
  } else if (isThisYear) {
    // This year but not today: Show month + day + time (Feb 15, 2:34 PM)
    return messageDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    }) + ', ' + time;
  } else {
    // Different year: Show month + day + year + time (Feb 15, 2023, 2:34 PM)
    return messageDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }) + ', ' + time;
  }
}
