import type { PropsWithChildren } from 'react';
import styles from './Layout.module.css';

export function Layout({ children }: PropsWithChildren) {
  return <div className={styles.shell}>{children}</div>;
}
