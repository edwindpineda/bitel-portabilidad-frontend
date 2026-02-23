export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-background to-primary-100">
      {children}
    </div>
  );
}
