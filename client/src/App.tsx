import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { HotGrid } from './components/HotGrid';
import { Layout } from './components/Layout';
import mockHotData from './mock/hot.json';
import styles from './App.module.css';
import type { HotResponse } from './types/hot';

const mockResponse = mockHotData as HotResponse;

function App() {
  return (
    <Layout>
      <main className={styles.main}>
        <Header generatedAt={mockResponse.generatedAt} />
        <HotGrid platforms={mockResponse.platforms} />
      </main>
      <Footer cacheTtlSeconds={mockResponse.cacheTtlSeconds} />
    </Layout>
  );
}

export default App;
