// Encerramento programado do sistema.
//
// A contingência tem prazo: passada a data abaixo, o sistema não abre mais, e
// duas horas depois os pacientes são apagados do banco por uma tarefa agendada
// no Supabase (o SQL está em `supabase/encerramento.sql`).
//
// Este arquivo cuida apenas da tela, e é bom ser franco sobre o alcance disso:
// a verificação usa o relógio do computador de quem acessa, então atrasar o
// relógio contorna o bloqueio. O que realmente encerra o acesso é a revogação
// de permissões no banco, no mesmo instante — sem ela, quem tem a senha
// alcança os dados por fora do site.

// Início do uso: 28/08/2026 ao meio-dia de Brasília (UTC-3) = 15:00 UTC. Não
// bloqueia nada — quem tem a senha entra antes se precisar. Serve para a
// página inicial anunciar a partir de quando o sistema vale.
export const ABERTURA = new Date("2026-08-28T15:00:00Z");

// Duas datas de encerramento, de propósito.
//
// A contagem da faixa mira a meia-noite: é a hora anunciada para a equipe, a
// que todo mundo tem na cabeça. O bloqueio real vem meia hora depois, como
// margem para quem estiver terminando um documento quando o relógio virar.
//
// 29/08/2026 às 00h00 de Brasília (UTC-3) = 03:00 UTC.
export const ENCERRAMENTO_ANUNCIADO = new Date("2026-08-29T03:00:00Z");

// 29/08/2026 às 00h30 de Brasília = 03:30 UTC.
export const ENCERRAMENTO = new Date("2026-08-29T03:30:00Z");

// 29/08/2026 às 02h30 de Brasília = 05:30 UTC. Só para exibir na tela: quem
// apaga é a tarefa agendada no banco.
export const EXPURGO = new Date("2026-08-29T05:30:00Z");

// Faixa de aviso aparece quando falta menos que isto. Duas horas: a janela de
// uso inteira é curta — começa ao meio-dia de 28/08 e termina 12h30 depois —,
// então avisar com mais antecedência ocuparia boa parte do tempo de trabalho
// com um alarme que ninguém pode atender ainda.
const AVISO_ANTECEDENCIA_MS = 2 * 60 * 60 * 1000;

export function sistemaEncerrado(agora: Date = new Date()): boolean {
  return agora.getTime() >= ENCERRAMENTO.getTime();
}

export function msAteEncerrar(agora: Date = new Date()): number {
  return ENCERRAMENTO_ANUNCIADO.getTime() - agora.getTime();
}

// A faixa acompanha as duas horas anteriores à hora anunciada e continua
// visível na meia hora de margem, até o bloqueio.
export function dentroDoAviso(agora: Date = new Date()): boolean {
  if (sistemaEncerrado(agora)) return false;
  return msAteEncerrar(agora) <= AVISO_ANTECEDENCIA_MS;
}

// "3 h 20 min", "45 min", "2 min" — texto curto para caber na faixa. Passada a
// hora anunciada, não há contagem: o bloqueio pode cair a qualquer momento.
export function tempoRestante(agora: Date = new Date()): string | null {
  const restante = msAteEncerrar(agora);
  if (restante <= 0) return null;
  const minutos = Math.max(1, Math.ceil(restante / 60000));
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  if (horas === 0) return `${resto} min`;
  if (resto === 0) return `${horas} h`;
  return `${horas} h ${resto} min`;
}
