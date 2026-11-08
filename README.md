# Sacolão ABC — Resultados mensais

Painel independente para **ABC DOZE DE OUTUBRO** e **ABC PEDRO LEOPOLDO**, com identidade visual baseada na interface do RHADM. Não inclui o banco, os dados de funcionários nem os módulos do sistema de referência.

## Uso

Selecione unidade e mês, clique em **Lançar dados** e preencha venda geral, compras de biscoitos, folhas e demais produtos, despesas sem detalhamento das vendas por categoria. A venda geral é o total oficial.

A aba **Apresentação de resultados** abre dez slides para televisão, em tela cheia quando suportado pelo navegador. Use as setas ou Page Up/Page Down para navegar; Home/End vão ao início/fim. O roteiro de fala fica oculto e pode ser aberto manualmente (aparece também na TV). O botão Sair encerra a apresentação.

**Baixar PowerPoint** gera um `.pptx` de dez slides com a mesma aparência da apresentação do site. O gerador carrega a própria página em uma área de renderização de 1920 × 1080, usando os mesmos componentes HTML, CSS e a fonte Manrope local. Cada página entra no PPT como uma imagem PNG integral, sem alterar seus pixels. Isso mantém a aparência fiel; textos e gráficos não são editáveis separadamente no PowerPoint. As notas de fala permanecem nas notas de cada slide. Os botões de navegação ficam invisíveis na exportação, preservando o espaço do layout.

O processamento ocorre no navegador; os lançamentos não são enviados a um servidor. Um snapshot isolado mantém o mês, a loja e os dados escolhidos durante toda a captura. O gerador usa PptxGenJS 4.0.1, JSZip e html-to-image 1.11.13 incluídos no site. As licenças MIT e SIL Open Font License estão junto ao código. O arquivo identifica exemplos como demonstração e exige revisão de lançamentos antigos antes de exportar. O slide entre lojas inclui as duas unidades e sinaliza exemplos ou ausência de dados.

A aba **Análises e gráficos** acrescenta margens bruta e líquida, destino do faturamento, venda acumulada versus meta, comparativo entre lojas, venda versus compras por semana e resultado líquido mensal. A meta acumulada distribui o valor mensal igualmente entre as semanas como referência, sem previsão automática. Valores negativos aparecem abaixo de zero e margens sem venda ficam sem base de cálculo.

TV e PowerPoint usam a identidade da logo: verde principal, verde-claro, amarelo e vermelho. A logo PNG usa apenas o logotipo ABC fornecido pelo usuário, igual ao outro portal. O layout da reunião usa um número principal por página, gráficos amplos, menos cartões e uma conclusão abaixo de cada gráfico. O calendário e os cálculos permanecem os mesmos do painel.

## Calendário de apuração

Cada semana tem sete dias, de segunda a domingo, sem divisão ou repetição entre períodos. Os limites seguem o calendário de apuração confirmado. Setembro/2026 começa em 31/08: 31/08–06/09, 07/09–13/09, 14/09–20/09, 21/09–27/09 e 28/09–04/10. Agosto/2026 termina em 30/08. Os demais meses começam na primeira segunda-feira do mês, preservando 30/11–06/12 como a 5ª semana de novembro. A numeração recomeça a cada período.

- Outubro/2026: 05/10–11/10, 12/10–18/10, 19/10–25/10 e 26/10–01/11.
- Novembro/2026: a 5ª semana é 30/11–06/12.
- Dezembro/2026: a 1ª semana começa em 07/12.

As confirmações específicas de setembro e novembro prevalecem sobre as regras gerais anteriores. A interface calcula automaticamente quatro ou cinco semanas. Lançamentos antigos exigem conferência das datas antes de serem apresentados; valores fora do calendário não são descartados automaticamente.

## Dados e resultados

Os exemplos são identificados como demonstração. Os lançamentos ficam **neste navegador**, sem servidor de dados ou sincronização entre computadores. Use Exportar backup para guardar e transferir o JSON; Importar backup valida o conteúdo e mescla os períodos, confirmando a substituição de períodos iguais. A mudança de domínio não transfere localStorage: exporte no domínio anterior e importe no novo.

Resultado bruto estimado = venda − compras. Resultado líquido estimado = resultado bruto − despesas. As compras são uma aproximação de custo; o painel não recebe estoque inicial/final para calcular CMV contábil. Média semanal = venda do período ÷ número de semanas apuradas.

## Desenvolvimento e publicação

Sem dependências de execução ou instalação:

```sh
node check.cjs
node build.cjs
node serve.cjs
```

Cloudflare Pages com integração GitHub:

- Repositório: `joaofonsecaabc-star/resultados-mensais`.
- Branch de produção: `main`.
- Framework: nenhum.
- Comando de build: `node build.cjs`.
- Diretório de saída: `dist`.
- Diretório raiz: raiz do repositório.

O site não precisa de D1, segredos, integrações ou variáveis de ambiente. A publicação contém apenas o aplicativo e os exemplos simulados. A fonte Manrope fica hospedada no próprio site para manter a exportação consistente.

## Importação de compras por PDF

Configurações → Importar PDFs lê localmente o relatório SGLinear Contas a Pagar com texto selecionável, usando PDF.js 5.6.205 (Apache-2.0, vendorizado). Filial 016 = Doze de Outubro; 027 = Pedro Leopoldo. Distribuidora é compra loja e Tradições é biscoito; outros fornecedores exigem classificação na prévia. A data é o vencimento, alocado conforme as datas do calendário de apuração.

A prévia compara soma e quantidade com o Total Geral e Quantidade Títulos quando encontrados, bloqueia divergências e permite revisar os campos. PDFs sem texto selecionável não são reconhecidos. Não há OCR. O modelo foi testado com PDF simulado; os PDFs originais e o segundo modelo ainda precisam ser conferidos.

A confirmação soma apenas as compras selecionadas, sem alterar vendas, despesas, metas ou observações reais. Exemplos do período são substituídos por registros reais zerados. Um histórico por filial/documento/parcela/fornecedor identifica títulos repetidos e bloqueia alterações de data/valor em títulos reconhecidos. A prévia avisa para não repetir compras já digitadas manualmente. A gravação é atômica no localStorage; o histórico acompanha o backup. Ao restaurar backup, o histórico dos períodos substituídos é substituído junto com os valores.

Os gráficos têm rótulos e informações detalhadas por ponteiro ou foco do teclado. Os rótulos também aparecem na captura do PPT; as informações interativas ficam no site.

Validação: `npm test` (dados sintéticos, duas filiais, vencimento e calendário, somas, duplicação, legado, navegação e cálculos) e `node build.cjs`.

A entrada de dados usa apenas venda geral, compras de biscoitos/folhas/demais produtos e despesas. A antiga visão de vendas por categoria foi substituída por Compras sobre vendas, com proporções semanais e mensais. O quinto slide e seu roteiro seguem a mesma regra. Campos legados de categoria permanecem legíveis nos backups antigos e são zerados ao salvar novamente o formulário simplificado.

## PDF de venda diária

O segundo leitor identifica a data do movimento e importa exclusivamente a linha Tot Data na coluna Tot. Carteiras, ignorando as linhas dos caixas e Tot. Venda. A filial é extraída do cabeçalho ou do nome da unidade; se ausente, a prévia exige escolher 016/027. Cada loja e dia formam uma identidade para impedir duplicação do movimento. O valor diário é somado à venda geral da semana. Modelo validado com dados sintéticos; os arquivos originais ainda são necessários para validar o layout real.

Correção de setembro/2026: `periodForDate` é a fonte única para localizar loja/mês/semana das importações. Períodos totalmente zerados são ajustados automaticamente à nova quantidade de semanas. Períodos antigos com valores são preservados para revisão no editor; históricos legados de PDFs permanecem válidos para evitar perda de dados ou duplicação.
