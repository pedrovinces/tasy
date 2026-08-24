// Catálogo de exames da solicitação.
//
// Fonte dos laboratoriais: o "Registro de controle interno" do Richet, que a
// unidade já usa em papel — adaptado do nível de analito para o nível de
// pedido. O laboratório controla hemácias, hemoglobina e hematócrito em linhas
// separadas; o médico pede "hemograma completo", e é assim que a lista está.
//
// Pelo mesmo motivo, exames que sempre saem completos aparecem como item único
// (hemograma, EAS), enquanto painéis que são pedidos em partes aparecem
// individualizados (TAP e PTT, TGO e TGP e GGT).
//
// Os rótulos são únicos em todo o catálogo — a seleção é feita pelo próprio
// texto, que é também o que sai impresso. Trocar, acrescentar ou remover exame
// é mexer só neste arquivo: nem o formulário nem a folha impressa conhecem a
// lista.

export interface GrupoExames {
  titulo: string;
  itens: readonly string[];
}

export const EXAMES_LABORATORIAIS: readonly GrupoExames[] = [
  {
    titulo: "Hematologia e coagulação",
    itens: ["Hemograma completo", "TAP", "PTT", "Fibrinogênio", "D-dímero"],
  },
  {
    titulo: "Bioquímica",
    itens: [
      "Ureia",
      "Creatinina",
      "Sódio",
      "Potássio",
      "Cálcio",
      "Magnésio",
      "Fósforo",
      "Cloro",
      "Glicose",
      "Gasometria arterial",
      "Lactato",
      "PCR",
      "Albumina",
      "Proteínas totais",
      "Ácido úrico",
      "Bilirrubina total",
      "Bilirrubina direta",
      "Bilirrubina indireta",
      "TGO/AST",
      "TGP/ALT",
      "GGT",
      "Fosfatase alcalina",
      "Amilase",
      "Lipase",
      "CPK",
      "CK-MB",
      "LDH",
      "Ferro",
      "Colesterol total",
      "HDL",
      "LDL",
      "Triglicerídeos",
    ],
  },
  {
    titulo: "Enzimas e hormônios",
    itens: ["Beta-HCG", "Pró-BNP", "CK-massa", "Mioglobina", "Troponina", "TSH", "T4 livre"],
  },
  {
    titulo: "Urina",
    itens: ["EAS — Elementos Anormais e Sedimentoscopia"],
  },
  {
    titulo: "Microbiologia e testes rápidos",
    itens: [
      "COVID-19 (RT-PCR)",
      "Teste rápido COVID",
      "Teste rápido Influenza A e B",
      "Painel molecular",
    ],
  },
];

export const EXAMES_IMAGEM: GrupoExames = {
  titulo: "Exames de imagem",
  itens: [
    "RX de tórax",
    "RX de abdome",
    "TC de crânio",
    "TC de tórax",
    "TC de abdome e pelve",
    "Angio-TC de tórax",
    "USG de abdome",
    "USG de rins e vias urinárias",
    "USG com doppler de membros inferiores",
    "Ecocardiograma transtorácico",
    "RM de crânio",
  ],
} as const;

// A folha impressa separa laboratoriais de imagem; esta é a fonte da separação.
const ITENS_IMAGEM = new Set<string>(EXAMES_IMAGEM.itens);

export function ehExameDeImagem(exame: string): boolean {
  return ITENS_IMAGEM.has(exame);
}
