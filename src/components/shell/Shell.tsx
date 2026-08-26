'use client';

import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { KeyboardShortcuts } from './KeyboardShortcuts';
import { AiPanel } from './AiPanel';

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-ck-dark">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
      <KeyboardShortcuts />
      <AiPanel />
    </div>
  );
}
