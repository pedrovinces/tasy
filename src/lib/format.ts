import { format } from "date-fns";

// datas: dd/mm/aaaa — horas: 24h

export function formatarData(valor: string): string {
  const d = valor.length === 10 ? new Date(valor + "T00:00:00") : new Date(valor);
  if (Number.isNaN(d.getTime())) return "";
  return format(d, "dd/MM/yyyy");
}

export function formatarHora(valor: string): string {
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return "";
  return format(d, "HH:mm");
}

export function formatarDataHora(valor: string): string {
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return "";
  return format(d, "dd/MM/yyyy 'às' HH:mm");
}

// Idade nunca é armazenada: sempre calculada a partir da data de nascimento.
export function calcularIdade(dataNascimento: string, referencia: Date = new Date()): string {
  const nasc = new Date(dataNascimento + "T00:00:00");
  if (Number.isNaN(nasc.getTime())) return "";

  let anos = referencia.getFullYear() - nasc.getFullYear();
  const mesRef = referencia.getMonth();
  const mesNasc = nasc.getMonth();
  if (mesRef < mesNasc || (mesRef === mesNasc && referencia.getDate() < nasc.getDate())) {
    anos--;
  }
  if (anos >= 1) return `${anos} ${anos === 1 ? "ano" : "anos"}`;

  let meses = (referencia.getFullYear() - nasc.getFullYear()) * 12 + (mesRef - mesNasc);
  if (referencia.getDate() < nasc.getDate()) meses--;
  if (meses >= 1) return `${meses} ${meses === 1 ? "mês" : "meses"}`;

  const dias = Math.max(0, Math.floor((referencia.getTime() - nasc.getTime()) / 86400000));
  return `${dias} ${dias === 1 ? "dia" : "dias"}`;
}

// Valor inicial para <input type="datetime-local"> com a hora local atual.
export function agoraParaInput(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
