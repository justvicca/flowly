export function SplashScreen(): JSX.Element {
  return (
    <div
      data-testid="splash-screen"
      style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}
    >
      <div role="status" aria-label="Carregando">Carregando...</div>
    </div>
  );
}
