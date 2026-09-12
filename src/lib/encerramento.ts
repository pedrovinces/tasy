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

// ABERTURA — 12/09/2026 às 23h de Brasília (UTC-3) = 13/09 às 02:00 UTC.
//
// Antes desta hora o sistema não abre para ninguém: a raiz, a tela de senha e
// as telas internas levam para /em-breve. Não precisa de interruptor como o
// encerramento: uma data de abertura se desliga sozinha quando passa.
//
// A espera é só de tela, por opção: o banco ficou liberado desde já
// (supabase/seeds/abertura.sql). Isso quer dizer que a verificação roda no
// computador de quem acessa — quem atrasar o relógio, ou chamar a API direto
// com a senha da equipe, entra antes da hora. Serve para organizar a equipe,
// não para trancar o acesso.
export const ABERTURA = new Date("2026-09-13T02:00:00Z");

export function sistemaAindaFechado(agora: Date = new Date()): boolean {
  return agora.getTime() < ABERTURA.getTime();
}

// Passe livre para conferir o sistema antes da hora, num aparelho só.
//
// Abrir qualquer endereço com ?antecipar=<a palavra abaixo> marca ESTE
// navegador, e ele passa a entrar antes das 23h. ?antecipar=sair desfaz.
//
// Não é segurança, e não adianta fingir que é: a palavra viaja no pacote que o
// navegador baixa, então quem abrir o código do site a encontra. O que ela
// resolve é outra coisa — evitar que a equipe, que conhece os endereços e a
// senha, comece a usar antes da hora combinada.
//
// A marca é gravada junto com a data de abertura que ela libera. Assim, se um
// dia for marcada uma nova espera, este aparelho não a fura em silêncio por
// causa de um passe esquecido de meses atrás.
const CHAVE_ANTECIPACAO = "contingencia.antecipar";
const PALAVRA_ANTECIPACAO = "conferir-9f4c2a";

export function acessoAntecipado(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const pedido = new URLSearchParams(window.location.search).get("antecipar");
    if (pedido === PALAVRA_ANTECIPACAO) {
      window.localStorage.setItem(CHAVE_ANTECIPACAO, ABERTURA.toISOString());
    } else if (pedido === "sair") {
      window.localStorage.removeItem(CHAVE_ANTECIPACAO);
    }
    return window.localStorage.getItem(CHAVE_ANTECIPACAO) === ABERTURA.toISOString();
  } catch {
    // Navegação anônima e armazenamento bloqueado caem aqui: sem passe, espera
    // como todo mundo.
    return false;
  }
}

/** A espera vale para este navegador? É o que as telas perguntam. */
export function esperandoAbertura(): boolean {
  return sistemaAindaFechado() && !acessoAntecipado();
}

// REABERTO POR TEMPO INDETERMINADO — 12/09/2026.
//
// A contingência de 28/08 terminou e o sistema ficou bloqueado, como
// programado. Foi reaberto sem nova data de fechamento, a pedido.
//
// Enquanto esta constante for `false`, as datas abaixo ficam só de registro
// histórico: nada bloqueia, nenhuma faixa de contagem aparece e a tela de
// encerramento só é alcançada por quem digitar /encerrado.
//
// PARA REPROGRAMAR: ponha `true` e ajuste as três datas. Não esqueça do banco —
// a tela sozinha não encerra nada, e o `supabase/encerramento.sql` explica por
// quê.
const ENCERRAMENTO_PROGRAMADO = false;

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
  if (!ENCERRAMENTO_PROGRAMADO) return false;
  return agora.getTime() >= ENCERRAMENTO.getTime();
}

export function msAteEncerrar(agora: Date = new Date()): number {
  return ENCERRAMENTO_ANUNCIADO.getTime() - agora.getTime();
}

// A faixa acompanha as duas horas anteriores à hora anunciada e continua
// visível na meia hora de margem, até o bloqueio.
export function dentroDoAviso(agora: Date = new Date()): boolean {
  if (!ENCERRAMENTO_PROGRAMADO) return false;
  if (sistemaEncerrado(agora)) return false;
  return msAteEncerrar(agora) <= AVISO_ANTECEDENCIA_MS;
}

// "3 h 20 min", "45 min", "2 min" — texto curto para caber na faixa. Passada a
// hora anunciada, não há contagem: o bloqueio pode cair a qualquer momento.
export function tempoRestante(agora: Date = new Date()): string | null {
  if (!ENCERRAMENTO_PROGRAMADO) return null;
  const restante = msAteEncerrar(agora);
  if (restante <= 0) return null;
  const minutos = Math.max(1, Math.ceil(restante / 60000));
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  if (horas === 0) return `${resto} min`;
  if (resto === 0) return `${horas} h`;
  return `${horas} h ${resto} min`;
}
