const labels: Record<string, string> = {
  DRAFT: "Rascunho",
  ACTIVE: "Ativa",
  PAUSED: "Pausada",
  ENDED: "Encerrada",
  ARCHIVED: "Arquivada",
  PENDING: "Pendente",
  BLOCKED: "Bloqueado",
  UNSUBSCRIBED: "Descadastrado",
  AVAILABLE: "Liberada",
  CLAIMED: "Resgatada",
  REVOKED: "Revogada",
  EXPIRED: "Expirada",
  CLICKED: "Link acessado",
  REGISTERED: "Cadastro concluído",
  VALIDATED: "Validada",
  QUALIFIED: "Qualificada",
  REJECTED: "Rejeitada",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`status status-${status.toLowerCase()}`}>
      {labels[status] ?? status}
    </span>
  );
}
