'use client';

import Flow from '@/components/Flow';
import { TaskProvider } from '@/contexts/TaskContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

export default function Home() {
  return (
    <ThemeProvider>
      <TaskProvider>
        <main className="h-screen w-full">
          <Flow />
        </main>
      </TaskProvider>
    </ThemeProvider>
  );
} 