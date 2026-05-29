import { formatRelativeTime } from '../utils/formatRelativeTime';
import styles from './Header.module.css';

interface HeaderProps {
  generatedAt: string;
}

export function Header({ generatedAt }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div>
        <p className={styles.eyebrow}>Mini Hot Hub</p>
        <h1>今日热搜榜</h1>
        <p className={styles.subtitle}>一页扫过微博、知乎与 B站正在被讨论的热门内容。</p>
      </div>
      <div className={styles.meta}>
        <span>Mock 数据</span>
        <strong>{formatRelativeTime(generatedAt)}</strong>
      </div>
    </header>
  );
}
