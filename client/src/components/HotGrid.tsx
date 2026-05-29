import type { HotPlatform } from '../types/hot';
import { HotCard } from './HotCard';
import styles from './HotGrid.module.css';

interface HotGridProps {
  platforms: HotPlatform[];
}

export function HotGrid({ platforms }: HotGridProps) {
  return (
    <section className={styles.grid} aria-label="三平台热榜">
      {platforms.map((platform) => (
        <HotCard key={platform.source} platform={platform} />
      ))}
    </section>
  );
}
