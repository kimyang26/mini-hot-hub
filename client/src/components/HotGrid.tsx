import type { HotPlatform } from '../types/hot';
import { HotCard } from './HotCard';
import styles from './HotGrid.module.css';

interface HotGridProps {
  platforms: HotPlatform[];
  isLoading?: boolean;
}

export function HotGrid({ platforms, isLoading = false }: HotGridProps) {
  return (
    <section className={styles.grid} aria-label="三平台热榜">
      {platforms.map((platform) => (
        <HotCard key={platform.source} isLoading={isLoading} platform={platform} />
      ))}
    </section>
  );
}
