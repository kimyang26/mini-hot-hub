import { useEffect, useState } from 'react';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { HotGrid } from './components/HotGrid';
import { Layout } from './components/Layout';
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

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsLoading(false);
    }, 600);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <Layout>
      <main className={styles.main}>
        <Header generatedAt={mockResponse.generatedAt} />
        <HotGrid isLoading={isLoading} platforms={mockResponse.platforms} />
      </main>
      <Footer cacheTtlSeconds={mockResponse.cacheTtlSeconds} />
    </Layout>
  );
}

export default App;
