import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <h2 className="text-2xl font-bold mb-4">404 - Página no encontrada</h2>
      <p className="text-muted-foreground mb-6">La página solicitada no existe.</p>
      <Link 
        href="/"
        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:opacity-90"
      >
        Volver al Inicio
      </Link>
    </div>
  );
}
