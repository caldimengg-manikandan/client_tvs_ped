/**
 * Format a date as a relative human-readable string (e.g. "3 min ago")
 */
export function formatDistanceToNow(dateInput) {
    if (!dateInput) return '';
    const now = Date.now();
    const ts = new Date(dateInput).getTime();
    const diff = Math.max(0, now - ts);
    const secs = Math.floor(diff / 1000);
    if (secs < 60) return 'just now';
    const mins = Math.floor(secs / 60);
    if (mins < 60) return mins === 1 ? '1 min ago' : mins + ' min ago';
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs === 1 ? '1 hr ago' : hrs + ' hr ago';
    const days = Math.floor(hrs / 24);
    if (days < 30) return days === 1 ? 'Yesterday' : days + ' days ago';
    const months = Math.floor(days / 30);
    return months === 1 ? '1 month ago' : months + ' months ago';
}
