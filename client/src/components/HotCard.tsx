import type { HotPlatform } from '../types/hot';
import { formatRelativeTime } from '../utils/formatRelativeTime';
import { HotList } from './HotList';
import styles from './HotCard.module.css';

interface HotCardProps {
  platform: HotPlatform;
  isLoading?: boolean;
  onRetry?: () => void;
}

const sourceAccentClass: Record<HotPlatform['source'], string> = {
  weibo: styles.weibo,
  zhihu: styles.zhihu,
  bilibili: styles.bilibili,
};

export function HotCard({ platform, isLoading = false, onRetry }: HotCardProps) {
  const hasItems = platform.status === 'success' && platform.items.length > 0;

  return (
    <article className={`${styles.card} ${sourceAccentClass[platform.source]}`}>
      <header className={styles.header}>
        <div>
          <p className={styles.sourceName}>{platform.sourceName}</p>
          <h2>{platform.listName}</h2>
        </div>
        <span className={styles.badge}>{platform.items.length} 条</span>
      </header>

      <div className={styles.body}>
        {isLoading ? <p className={styles.stateText}>正在获取热榜...</p> : null}
        {!isLoading && hasItems ? <HotList items={platform.items.slice(0, 10)} /> : null}
        {!isLoading && platform.status === 'empty' ? (
          <p className={styles.stateText}>{platform.message ?? '当前暂无可展示内容'}</p>
        ) : null}
        {!isLoading && platform.status === 'error' ? (
          <div className={styles.errorBlock}>
            <p>{platform.message ?? '暂时获取失败，请稍后再试'}</p>
            {onRetry ? (
              <button className={styles.retryButton} type="button" onClick={onRetry}>
                重试
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <footer className={styles.footer}>
        {platform.status === 'success' ? formatRelativeTime(platform.updatedAt) : '等待可用数据'}
      </footer>
    </article>
  );
}
