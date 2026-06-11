export function formatRelativeTime(isoTime?: string, now = Date.now()): string {
  if (!isoTime) {
    return '暂无更新时间';
  }

  const timestamp = new Date(isoTime).getTime();
  const diffMs = now - timestamp;

  if (Number.isNaN(timestamp) || diffMs < 0) {
    return '刚刚更新';
  }

  const diffMinutes = Math.floor(diffMs / 60_000);

  if (diffMinutes < 1) {
    return '刚刚更新';
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} 分钟前`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} 小时前`;
  }

  return `更新于 ${new Date(isoTime).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}
