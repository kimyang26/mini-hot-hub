import type { HotItem } from '../types/hot';
import styles from './HotList.module.css';

interface HotListProps {
  items: HotItem[];
}

function getRankClass(rank: number): string {
  if (rank === 1) {
    return styles.rankFirst;
  }

  if (rank === 2) {
    return styles.rankSecond;
  }

  if (rank === 3) {
    return styles.rankThird;
  }

  return '';
}

export function HotList({ items }: HotListProps) {
  return (
    <ol className={styles.list}>
      {items.map((item) => (
        <li key={`${item.rank}-${item.url}`} className={styles.item}>
          <span className={`${styles.rank} ${getRankClass(item.rank)}`}>{item.rank}</span>
          <a className={styles.title} href={item.url} target="_blank" rel="noopener noreferrer">
            {item.title}
          </a>
          {item.heat ? <span className={styles.heat}>{item.heat}</span> : null}
        </li>
      ))}
    </ol>
  );
}
