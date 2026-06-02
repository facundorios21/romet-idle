import type { Metadata } from 'next';
import './globals.css';
import { UserProvider } from '@/context/UserContext';

export const metadata: Metadata = {
  title: 'Aetheria: Mythical Card Collector',
  description: 'Un juego premium de gacha y coleccionismo de cartas místicas de Aetheria. Abre sobres, acumula esencias y completa tu álbum.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <UserProvider>{children}</UserProvider>
      </body>
    </html>
  );
}
