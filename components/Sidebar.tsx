'use client';

import { usePathname, useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useState } from 'react';
import Link from 'next/link';

const navigationItems = [
  { name: 'Dictation', href: '/dictation', icon: '🎤' },
  { name: 'Dictionary', href: '/dictionary', icon: '📖' },
  { name: 'Settings', href: '/settings', icon: '⚙️' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
    router.refresh();
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        style={{
          position: 'fixed',
          top: '1rem',
          left: '1rem',
          zIndex: 1001,
          padding: '0.5rem',
          backgroundColor: '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          display: 'block',
        }}
        aria-label="Toggle menu"
      >
        <span style={{ fontSize: '1.5rem' }}>☰</span>
      </button>

      {/* Sidebar */}
      <aside
        className="sidebar"
        style={{
          position: 'fixed',
          left: isMobileMenuOpen ? 0 : '-250px',
          top: 0,
          height: '100vh',
          width: '250px',
          backgroundColor: '#f5f5f5',
          borderRight: '1px solid #e0e0e0',
          padding: '2rem 0',
          transition: 'left 0.3s ease',
          zIndex: 1000,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ padding: '0 1.5rem', marginBottom: '2rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>
            Voice Keyboard
          </h2>
          {session?.user && (
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#666' }}>
              {session.user.name}
            </p>
          )}
        </div>

        <nav>
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                style={{
                  display: 'block',
                  padding: '0.75rem 1.5rem',
                  color: isActive ? '#0070f3' : '#333',
                  backgroundColor: isActive ? '#e3f2fd' : 'transparent',
                  textDecoration: 'none',
                  borderLeft: isActive ? '3px solid #0070f3' : '3px solid transparent',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = '#f0f0f0';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <span style={{ marginRight: '0.5rem' }}>{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div style={{ marginTop: 'auto', padding: '1.5rem' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#c82333';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#dc3545';
            }}
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
          }}
        />
      )}
    </>
  );
}

