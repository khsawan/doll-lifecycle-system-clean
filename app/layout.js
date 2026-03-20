import './globals.css';

export const metadata = {
  title: 'Doll Lifecycle System',
  description: 'Maille & Merveille internal operating system',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
