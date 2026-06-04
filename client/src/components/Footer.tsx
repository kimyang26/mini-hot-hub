import styles from './Footer.module.css';

interface FooterProps {
  cacheTtlSeconds: number;
}

export function Footer({ cacheTtlSeconds }: FooterProps) {
  const minutes = Math.round(cacheTtlSeconds / 60);

  return (
    <footer className={styles.footer}>
      本站为非官方热点聚合学习项目，微博已接入真实热搜，知乎与 B站仍使用 Mock 数据。内容与版权归原平台及原作者所有，
      信息仅供浏览参考，请以原平台内容为准。数据约每 {minutes} 分钟更新一次。
    </footer>
  );
}
