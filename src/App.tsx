import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';
import './styles/theme-overrides.css';
const queryClient = new QueryClient();
export function App() {
  const [isDark, setIsDark] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme ? savedTheme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);
  const toggleTheme = () => {
    setIsDark(!isDark);
  };
  return (
    <QueryClientProvider client={queryClient}>
      <div className="relative">
        <Layout />
        <Button
          onClick={toggleTheme}
          variant="ghost"
          size="icon"
          className="fixed bottom-4 right-4 z-50 rounded-full shadow-lg bg-background/80 backdrop-blur-sm"
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </div>
    </QueryClientProvider>
  );
}