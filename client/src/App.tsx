import { useEffect, useState } from 'react';
import { fetchAllHot } from './api/hot';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { HotGrid } from './components/HotGrid';
import { Layout } from './components/Layout';
import styles from './App.module.css';
import type { HotPlatform, HotResponse, SourceKey } from './types/hot';

const loadingDelayMs = 600;
const defaultCacheTtlSeconds = 600;

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
    message: 'Mock API 暂时不可用，请确认 Express 服务已启动',
  }));
}

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [hotResponse, setHotResponse] = useState<HotResponse>({
    platforms: initialPlatforms,
    generatedAt: new Date().toISOString(),
    cacheTtlSeconds: defaultCacheTtlSeconds,
  });

  useEffect(() => {
    let isCancelled = false;

    async function loadHotFromApi() {
      const delayPromise = new Promise<void>((resolve) => {
        window.setTimeout(resolve, loadingDelayMs);
      });
      const hotPromise = fetchAllHot(10)
        .then((response) => ({ type: 'success' as const, response }))
        .catch(() => ({ type: 'error' as const }));

      const [result] = await Promise.all([hotPromise, delayPromise]);

      if (isCancelled) {
        return;
      }

      if (result.type === 'success') {
        setHotResponse(result.response);
      } else {
        setHotResponse((currentResponse) => ({
          ...currentResponse,
          generatedAt: new Date().toISOString(),
          platforms: createApiErrorPlatforms(),
        }));
      }

      setIsLoading(false);
    }

    void loadHotFromApi();

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <Layout>
      <main className={styles.main}>
        <Header generatedAt={hotResponse.generatedAt} />
        <HotGrid isLoading={isLoading} platforms={hotResponse.platforms} />
      </main>
      <Footer cacheTtlSeconds={hotResponse.cacheTtlSeconds} />
    </Layout>
  );
}

export default App;
