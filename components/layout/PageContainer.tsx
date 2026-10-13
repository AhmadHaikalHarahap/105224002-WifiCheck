import AppSidebar from './AppSidebar';
import AppHeader from './AppHeader';

interface PageContainerProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export default function PageContainer({
  title,
  description,
  children,
}: PageContainerProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <AppSidebar />

      {/* Main content area - offset by sidebar width on desktop */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Header */}
        <AppHeader title={title} description={description} />

        {/* Page content */}
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>

        {/* Footer */}
        <footer className="border-t border-card-border px-4 py-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs text-muted">
            WiFi Check v0.1 — Educational security assessment tool. This application does not scan actual networks.
          </p>
        </footer>
      </div>
    </div>
  );
}
