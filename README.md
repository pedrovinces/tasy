# ICU Support System

CONTEXTO DO PROJETO

Aplicação de contingência para uma unidade de terapia intensiva. O prontuário eletrônico do

hospital ficará indisponível durante uma troca de sistemas. A equipe usará esta aplicação para

registrar evoluções e receitas no computador, imprimir em papel timbrado idêntico ao do hospital,

assinar e carimbar. Os impressos são anexados ao prontuário oficial depois.

REGRAS QUE VALEM SEMPRE

1. Isto não é prontuário eletrônico. Nunca implemente assinatura eletrônica, nunca gere texto

   afirmando validade jurídica do documento em tela. O documento vale após impressão, assinatura

   e carimbo manuais.

2. Dados de paciente são dados pessoais sensíveis. Nunca escreva nome de paciente em URL, em

   parâmetro de rota, em nome de arquivo exportado ou em console.log. Nunca envie dado de paciente

   para qualquer serviço externo. Sem analytics, sem telemetria, sem script de terceiro.

3. Colete apenas estes campos identificadores: nome completo, filiação, data de nascimento, sexo,

   leito e setor. Nunca crie campo de CPF, prontuário, matrícula de convênio, convênio ou data de

   admissão. Esses rótulos existem só no papel impresso, sempre com valor vazio.

4. Toda tabela do Supabase nasce com Row Level Security ativa e política explícita. Nunca deixe

   tabela pública nem política com `using (true)` para leitura de dados de paciente.

5. Exclusão de paciente é lógica, marcando `ativo = false`. Nunca faça DELETE físico de paciente

   ou de documento por ação da interface.

6. Idade nunca é armazenada. É sempre calculada na hora, a partir da data de nascimento.

7. A interface usa Tailwind e shadcn/ui. A folha de impressão é a exceção: fica em um arquivo CSS

   próprio, com medidas em milímetros e sem classes utilitárias, para não deformar o timbre em A4.

8. Idioma da interface: português do Brasil. Datas em dd/mm/aaaa. Horas em formato 24h.

9. Não instale biblioteca nova sem necessidade real. Não troque de biblioteca de rotas, de estado

   ou de formulário depois que algo estiver funcionando.

10. Quando eu pedir uma mudança em uma tela, altere apenas aquela tela. Não refatore o resto.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://tasy.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/9deaf0cb-e224-4fc4-89e1-7ba3b20f7cf2).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
