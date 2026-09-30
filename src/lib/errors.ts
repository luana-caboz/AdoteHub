export type ActionState<T = undefined> =
  | { ok: true; message?: string; data?: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> }
  | null;

export function friendlyDbError(error: { message?: string; code?: string } | null | undefined): string {
  if (!error) return "Erro desconhecido.";
  if (error.code === "23505") return "Já existe um registro com esse valor.";
  if (error.code === "42501") return "Você não tem permissão para isso.";
  if (error.code === "P0001" && error.message) return error.message;
  return "Não foi possível concluir. Tente novamente.";
}
