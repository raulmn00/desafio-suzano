import { NavLink } from 'react-router-dom';

const LINKS: Array<{ to: string; label: string }> = [
  { to: '/ordens', label: 'Ordens de Venda' },
  { to: '/monitoramento', label: 'Monitoramento' },
  { to: '/agendamento', label: 'Agendamento' },
  { to: '/clientes', label: 'Clientes' },
  { to: '/tipos-transporte', label: 'Tipos de Transporte' },
  { to: '/itens', label: 'Itens' },
  { to: '/auditoria', label: 'Auditoria' },
];

export function Nav() {
  return (
    <nav>
      {LINKS.map((link) => (
        <NavLink key={link.to} to={link.to} className={({ isActive }) => (isActive ? 'active' : '')}>
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}
