import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { Button } from './ui/Button';
import { Nav } from './Nav';

export function Layout() {
  const { usuario, isOperador, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await signOut();
    navigate('/login', { replace: true });
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">OVGS</div>
        <Nav />
        <div className="user-box">
          <div className="name">{usuario?.nome}</div>
          <div className="role">
            {usuario?.papel}
            {usuario && !isOperador ? ' · somente leitura' : ''}
          </div>
          <Button variant="secondary" small style={{ marginTop: '0.5rem' }} onClick={handleLogout}>
            Sair
          </Button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
