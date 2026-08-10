import { NextResponse } from "next/server";

import { requireAdminTenant } from "@/lib/authorization";
import { settingsApiError } from "@/modules/settings/api";

export async function GET() {
  try {
    const { clientId, session } = await requireAdminTenant();
    return NextResponse.json({
      roles: [
        { role: "ADMIN", label: "Administrador", permissions: ["Gerenciar campanhas e automações", "Configurar integrações e segredos", "Consultar e exportar dados"] },
        { role: "CLIENT", label: "Cliente", permissions: ["Consultar campanhas, participantes, recompensas e relatórios", "Dados pessoais mascarados", "Sem acesso às configurações administrativas"] },
      ],
      session: {
        strategy: "JWT",
        provider: "Google OAuth",
        durationDays: 30,
        currentRole: session.user.role,
        currentUser: session.user.email,
        tenantIdMasked: `${clientId.slice(0, 4)}••••${clientId.slice(-4)}`,
      },
      privacy: [
        { label: "Mascaramento de dados para clientes", active: true },
        { label: "Escopo por empresa nas consultas", active: true },
        { label: "Exportação administrativa de leads", active: true },
        { label: "Exclusão automática de dados", active: false, note: "Não configurada neste projeto." },
      ],
    });
  } catch (error) { return settingsApiError(error, "Não foi possível carregar as informações de segurança."); }
}
