import { formatRelativeTime } from '../utils/formatRelativeTime';
import styles from './Header.module.css';

interface HeaderProps {
  generatedAt: string;
  cacheTtlSeconds: number;
  isRefreshing: boolean;
  now: number;
  onRefresh: () => void;
}

export function Header({ cacheTtlSeconds, generatedAt, isRefreshing, now, onRefresh }: HeaderProps) {
  const cacheMinutes = Math.max(1, Math.round(cacheTtlSeconds / 60));

  return (
    <header className={styles.header}>
      <div>
        <p className={styles.eyebrow}>Mini Hot Hub</p>
        <h1>今日热搜榜</h1>
        <p className={styles.subtitle}>一页扫过微博、知乎与 B站正在被讨论的热门内容。</p>
      </div>
      <div className={styles.actions}>
        <div className={styles.meta}>
          <span>真实 API</span>
          <strong>{formatRelativeTime(generatedAt, now)}</strong>
        </div>
        <button
          className={styles.refreshButton}
          type="button"
          disabled={isRefreshing}
          onClick={onRefresh}
        >
          {isRefreshing ? '刷新中' : '刷新热榜'}
        </button>
        <p className={styles.cacheHint}>缓存 {cacheMinutes} 分钟内可能不变</p>
      </div>
    </header>
  );
}
