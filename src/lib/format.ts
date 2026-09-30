const dateFmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });

export function formatDateTime(iso: string): string {
  return dateFmt.format(new Date(iso));
}

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function whatsappLink(phone: string, text?: string): string {
  let digits = onlyDigits(phone);
  if (digits.length <= 11) digits = `55${digits}`;
  const q = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${digits}${q}`;
}
