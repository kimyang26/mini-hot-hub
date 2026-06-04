import { useEffect, useState } from 'react';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { HotGrid } from './components/HotGrid';
import { Layout } from './components/Layout';
import { fetchHotPlatform } from './api/hot';
import mockHotData from './mock/hot.json';
import styles from './App.module.css';
import type { HotPlatform, HotResponse } from './types/hot';

type MockPlatform = HotPlatform & {
  error?: boolean;
  empty?: boolean;
};

type MockHotResponse = Omit<HotResponse, 'platforms'> & {
  platforms: MockPlatform[];
};

function normalizeMockPlatform(platform: MockPlatform): HotPlatform {
  if (platform.error) {
    return {
      ...platform,
      status: 'error',
      updatedAt: undefined,
      items: [],
      message: platform.message ?? '暂时获取失败，请稍后再试',
    };
  }

  if (platform.empty || platform.items.length === 0) {
    return {
      ...platform,
      status: 'empty',
      items: [],
      message: platform.message ?? '当前暂无可展示内容',
    };
  }

  return {
    ...platform,
    status: 'success',
    items: platform.items.slice(0, 10),
  };
}

function normalizeMockResponse(response: MockHotResponse): HotResponse {
  return {
    ...response,
    platforms: response.platforms.map(normalizeMockPlatform),
  };
}

const mockResponse = normalizeMockResponse(mockHotData as MockHotResponse);
const loadingDelayMs = 600;

function replacePlatform(platforms: HotPlatform[], nextPlatform: HotPlatform): HotPlatform[] {
  return platforms.map((platform) =>
    platform.source === nextPlatform.source ? nextPlatform : platform,
  );
}

function createRequestErrorPlatform(platform: HotPlatform): HotPlatform {
  return {
    ...platform,
    status: 'error',
    updatedAt: undefined,
    items: [],
    message: '微博 Mock API 暂时不可用，请确认 Express 服务已启动',
  };
}

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [platforms, setPlatforms] = useState<HotPlatform[]>(mockResponse.platforms);

  useEffect(() => {
    let isCancelled = false;

    async function loadWeiboFromApi() {
      const delayPromise = new Promise<void>((resolve) => {
        window.setTimeout(resolve, loadingDelayMs);
      });
      const weiboPromise = fetchHotPlatform('weibo', 10)
        .then((platform) => ({ type: 'success' as const, platform }))
        .catch(() => ({ type: 'error' as const }));

      const [result] = await Promise.all([weiboPromise, delayPromise]);

      if (isCancelled) {
        return;
      }

      setPlatforms((currentPlatforms) => {
        const currentWeibo = currentPlatforms.find((platform) => platform.source === 'weibo');

        if (result.type === 'success') {
          return replacePlatform(currentPlatforms, result.platform);
        }

        if (currentWeibo) {
          return replacePlatform(currentPlatforms, createRequestErrorPlatform(currentWeibo));
        }

        return currentPlatforms;
      });
      setIsLoading(false);
    }

    void loadWeiboFromApi();

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <Layout>
      <main className={styles.main}>
        <Header generatedAt={mockResponse.generatedAt} />
        <HotGrid isLoading={isLoading} platforms={platforms} />
      </main>
      <Footer cacheTtlSeconds={mockResponse.cacheTtlSeconds} />
    </Layout>
  );
}

export default App;
