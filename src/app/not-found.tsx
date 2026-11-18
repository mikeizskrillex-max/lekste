import Link from 'next/link';
import lt from '../../messages/lt.json';

/** 404 for paths outside the language routes (e.g. files that do not exist). */
export default function RootNotFound() {
  return (
    <html lang="lt">
      <body
        style={{
          fontFamily: 'system-ui, sans-serif',
          background: '#faf5ec',
          color: '#22201c',
          display: 'grid',
          placeItems: 'center',
          minHeight: '100vh',
          margin: 0,
        }}
      >
        <main style={{ textAlign: 'center', padding: 24 }}>
          <p style={{ fontSize: 64, fontWeight: 700, color: '#c13f22', margin: 0 }}>404</p>
          <h1 style={{ fontSize: 28 }}>{lt.notFound.title}</h1>
          <Link href="/" style={{ color: '#c13f22', fontWeight: 600 }}>
            {lt.notFound.home}
          </Link>
        </main>
      </body>
    </html>
  );
}
