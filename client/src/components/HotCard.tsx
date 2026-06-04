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
  const itemCountLabel = isLoading ? '加载中' : `${platform.items.length} 条`;

  return (
    <article className={`${styles.card} ${sourceAccentClass[platform.source]}`}>
      <header className={styles.header}>
        <div>
          <p className={styles.sourceName}>{platform.sourceName}</p>
          <h2>{platform.listName}</h2>
        </div>
        <span className={styles.badge}>{itemCountLabel}</span>
      </header>

      <div className={styles.body}>
        {isLoading ? (
          <div className={styles.loadingBlock} aria-label={`${platform.sourceName}正在获取热榜`}>
            {Array.from({ length: 10 }, (_, index) => (
              <span key={index} className={styles.skeletonLine} />
            ))}
          </div>
        ) : null}
        {!isLoading && hasItems ? <HotList items={platform.items.slice(0, 10)} /> : null}
        {!isLoading && platform.status === 'empty' ? (
          <div className={styles.stateBlock}>
            <strong>暂无内容</strong>
            <p>{platform.message ?? '当前暂无可展示内容'}</p>
          </div>
        ) : null}
        {!isLoading && platform.status === 'error' ? (
          <div className={styles.errorBlock}>
            <strong>获取失败</strong>
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
        {isLoading
          ? '正在准备数据'
          : platform.status === 'success'
            ? formatRelativeTime(platform.updatedAt)
            : '等待可用数据'}
      </footer>
    </article>
  );
}
