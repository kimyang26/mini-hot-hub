import { useCallback, useEffect, useState } from 'react';
import { fetchAllHot } from './api/hot';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { HotGrid } from './components/HotGrid';
import { Layout } from './components/Layout';
import styles from './App.module.css';
import type { HotPlatform, HotResponse, SourceKey } from './types/hot';

const loadingDelayMs = 600;
const defaultCacheTtlSeconds = 600;
const minuteMs = 60_000;

const platformMeta: Record<SourceKey, Pick<HotPlatform, 'sourceName' | 'listName'>> = {
  weibo: {
    sourceName: '微博',
    listName: '热搜榜',
  },
  zhihu: {
    sourceName: '知乎',
    listName: '热榜',
  },
  bilibili: {
    sourceName: 'B站',
    listName: '热门',
  },
};

const initialPlatforms: HotPlatform[] = (Object.keys(platformMeta) as SourceKey[]).map((source) => ({
  source,
  ...platformMeta[source],
  status: 'empty',
  items: [],
  message: '正在获取热榜...',
}));

function createApiErrorPlatforms(): HotPlatform[] {
  return initialPlatforms.map((platform) => ({
    ...platform,
    status: 'error',
    message: '后端 API 暂时不可用，请确认 Express 服务已启动',
  }));
}

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState('正在连接三平台热榜...');
  const [now, setNow] = useState(0);
  const [hotResponse, setHotResponse] = useState<HotResponse>({
    platforms: initialPlatforms,
    generatedAt: new Date().toISOString(),
    cacheTtlSeconds: defaultCacheTtlSeconds,
  });

  const loadHotFromApi = useCallback(async (mode: 'initial' | 'manual') => {
    const isInitialLoad = mode === 'initial';

    if (isInitialLoad) {
      setIsLoading(true);
      setRefreshMessage('正在连接三平台热榜...');
    } else {
      setIsRefreshing(true);
      setRefreshMessage('正在刷新，缓存有效期内内容可能保持不变');
    }

    const delayPromise = isInitialLoad
      ? new Promise<void>((resolve) => {
          window.setTimeout(resolve, loadingDelayMs);
        })
      : Promise.resolve();
    const hotPromise = fetchAllHot(10)
      .then((response) => ({ type: 'success' as const, response }))
      .catch(() => ({ type: 'error' as const }));

    const [result] = await Promise.all([hotPromise, delayPromise]);

    if (result.type === 'success') {
      setHotResponse(result.response);
      setRefreshMessage(
        isInitialLoad ? '三平台热榜已加载' : '已重新请求热榜，缓存有效期内数据可能不变',
      );
    } else if (isInitialLoad) {
      setHotResponse((currentResponse) => ({
        ...currentResponse,
        generatedAt: new Date().toISOString(),
        platforms: createApiErrorPlatforms(),
      }));
      setRefreshMessage('后端暂时不可用，页面已进入错误态');
    } else {
      setRefreshMessage('刷新失败，已保留当前页面数据');
    }

    setNow(Date.now());
    setIsLoading(false);
    setIsRefreshing(false);
  }, []);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadHotFromApi('initial');
    }, 0);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [loadHotFromApi]);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setNow(Date.now());
    }, minuteMs);

    return () => {
      window.clearInterval(timerId);
    };
  }, []);

  function handleRefresh() {
    void loadHotFromApi('manual');
  }

  return (
    <Layout>
      <main className={styles.main} aria-busy={isLoading || isRefreshing}>
        <Header
          cacheTtlSeconds={hotResponse.cacheTtlSeconds}
          generatedAt={hotResponse.generatedAt}
          isRefreshing={isRefreshing}
          now={now}
          onRefresh={handleRefresh}
        />
        <div className={styles.statusBar} role="status">
          <span className={isLoading || isRefreshing ? styles.statusPulse : undefined} />
          {refreshMessage}
        </div>
        <HotGrid isLoading={isLoading} now={now} platforms={hotResponse.platforms} />
      </main>
      <Footer cacheTtlSeconds={hotResponse.cacheTtlSeconds} />
    </Layout>
  );
}

export default App;
