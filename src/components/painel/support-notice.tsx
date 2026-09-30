export function SupportBanner({ orgName }: { orgName: string }) {
  return (
    <div role="status" className="bg-mel-50 text-mel">
      <p className="mx-auto max-w-6xl px-4 py-2 text-sm font-semibold">
        Modo suporte: você está vendo o painel da {orgName} como equipe do AdoteHub. O que você alterar aqui fica
        registrado no histórico com o seu usuário.
      </p>
    </div>
  );
}

export function ApplicationsPrivacyNotice() {
  return (
    <div className="card flex flex-col gap-2">
      <h2 className="text-lg font-bold text-tinta">Candidaturas são visíveis só para a equipe da ONG</h2>
      <p className="max-w-prose text-tinta-suave">
        Para proteger os dados dos adotantes, o suporte do AdoteHub não tem acesso às candidaturas nem aos dados de quem
        se candidatou. Se precisar ajudar com uma candidatura, peça para alguém da equipe compartilhar a tela.
      </p>
    </div>
  );
}
