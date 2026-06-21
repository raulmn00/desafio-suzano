/**
 * Fallback do Error Boundary: mostrado quando um erro de runtime não tratado
 * "quebra" a árvore React. Mantém estilos inline para não depender de nada que
 * possa ter falhado no erro original.
 */
export function ErroFatal() {
  return (
    <div
      role="alert"
      style={{
        maxWidth: 480,
        margin: '4rem auto',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <h1 style={{ marginBottom: '0.5rem' }}>Algo deu errado</h1>
      <p style={{ marginBottom: '1.5rem' }}>
        Ocorreu um erro inesperado na aplicação. Tente recarregar a página.
      </p>
      <button type="button" onClick={() => window.location.reload()}>
        Recarregar
      </button>
    </div>
  );
}
