interface BadgeProps {
  status: string;
}

const STATUS_LABEL: Record<string, string> = {
  CRIADA: 'Criada',
  PLANEJADA: 'Planejada',
  AGENDADA: 'Agendada',
  EM_TRANSPORTE: 'Em transporte',
  ENTREGUE: 'Entregue',
};

/** Badge de status de OV; cor derivada do próprio status. */
export function Badge({ status }: BadgeProps) {
  const cls = status.toLowerCase();
  const known = cls in { criada: 1, planejada: 1, agendada: 1, em_transporte: 1, entregue: 1 };
  return (
    <span className={`badge ${known ? cls : 'neutral'}`} data-status={status}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}
