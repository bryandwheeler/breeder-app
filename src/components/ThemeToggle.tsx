// src/components/ThemeToggle.tsx
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

function getInitialTheme() {
  if (typeof window === 'undefined') return false;
  const saved = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return saved ? saved === 'dark' : prefersDark;
}

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  const toggle = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    localStorage.setItem('theme', newDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', newDark);
  };

  return (
    <Button variant='ghost' size='icon' onClick={toggle}>
      {isDark ? <Sun className='h-5 w-5' /> : <Moon className='h-5 w-5' />}
    </Button>
  );
}
