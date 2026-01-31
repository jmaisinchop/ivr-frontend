import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from '@/components/theme-provider'; // <--- IMPORTAR ESTO

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'IVR System',
  description: 'Plataforma de gestión de llamadas',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        {/* AGREGAR EL THEME PROVIDER AQUÍ */}
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}