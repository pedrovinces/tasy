// Catálogo de exames da solicitação.
//
// Fonte dos laboratoriais: o "Registro de controle interno" do Richet, que a
// unidade já usa em papel. Os rótulos são únicos em todo o catálogo — a
// seleção é feita pelo próprio texto, que é também o que sai impresso.
//
// Trocar, acrescentar ou remover exame é mexer só neste arquivo: nem o
// formulário nem a folha impressa conhecem a lista.

export interface GrupoExames {
  titulo: string;
  itens: readonly string[];
}

// Pedidos de rotina, em um clique. São rótulos próprios, não expansões: o que
// vai impresso é "Hemograma completo", e não os catorze analitos do quadro.
export const EXAMES_USUAIS: GrupoExames = {
  titulo: "Pedidos usuais",
  itens: [
    "Hemograma completo",
    "Coagulograma completo",
    "Função renal (ureia e creatinina)",
    "Hepatograma",
    "Eletrólitos (sódio, potássio, cálcio e magnésio)",
    "Marcadores cardíacos (troponina e CK-MB)",
    "EAS (urina tipo I)",
    "Gasometria arterial",
  ],
} as const;

export const EXAMES_LABORATORIAIS: readonly GrupoExames[] = [
  {
    titulo: "Eritrograma",
    itens: ["Hemácias", "Hemoglobina", "Hematócrito", "Plaquetas"],
  },
  {
    titulo: "Leucometria",
    itens: [
      "Leucócitos totais",
      "Basófilos",
      "Eosinófilos",
      "Mielócitos",
      "Metamielócitos",
      "Bastonetes",
      "Segmentados",
      "Linfócitos",
      "Monócitos",
      "Leucoblastos",
    ],
  },
  {
    titulo: "Enzimas e hormônios",
    itens: ["Beta-HCG", "Pró-BNP", "CK-massa", "Mioglobina", "Troponina", "TSH", "T4 livre"],
  },
  {
    titulo: "Coagulograma",
    itens: ["TAP (INR)", "TAP (segundos)", "TAP (%)", "PTT (segundos)", "PTT (%)", "Fibrinogênio"],
  },
  {
    titulo: "Urinálise — macroscopia",
    itens: [
      "pH urinário",
      "Densidade urinária",
      "Proteína na urina",
      "Glicose na urina",
      "Corpos cetônicos",
      "Bilirrubina na urina",
      "Hemoglobina na urina",
      "Nitrito",
      "Esterase leucocitária",
      "Urobilinogênio",
    ],
  },
  {
    titulo: "Urinálise — microscopia",
    itens: [
      "Cilindros",
      "Cristais",
      "Bactérias na urina",
      "Leveduras",
      "Leucócitos na urina",
      "Hemácias na urina",
    ],
  },
  {
    titulo: "Bioquímica",
    itens: [
      "Albumina",
      "Ácido úrico",
      "Amilase",
      "Lipase",
      "Bilirrubina direta",
      "Bilirrubina indireta",
      "Bilirrubina total",
      "Cálcio",
      "Cloro",
      "Sódio",
      "Potássio",
      "Magnésio",
      "Fósforo",
      "Ferro",
      "Colesterol total",
      "HDL",
      "LDL",
      "Triglicerídeos",
      "Glicose",
      "Ureia",
      "Creatinina",
      "Proteínas totais",
      "TGO/AST",
      "TGP/ALT",
      "GGT",
      "Fosfatase alcalina",
      "CPK",
      "CK-MB",
      "LDH",
      "PCR",
      "D-dímero",
      "Lactato",
    ],
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
