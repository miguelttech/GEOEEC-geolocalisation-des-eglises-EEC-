export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme="dark" style={{ minHeight: '100vh', background: '#0D1B12' }}>
      {children}
    </div>
  );
}
