# Sacolão ABC — Resultados mensais

Painel independente para **ABC DOZE DE OUTUBRO** e **ABC PEDRO LEOPOLDO**, com identidade visual baseada na interface do RHADM. Não inclui o banco, os dados de funcionários nem os módulos do sistema de referência.

## Uso

Selecione unidade e mês, clique em **Lançar dados** e preencha venda geral, compras de biscoitos, folhas e demais produtos, despesas e detalhamento opcional das vendas. A venda geral é o total oficial: categorias não são somadas novamente.

A aba **Apresentação de resultados** abre seis slides para televisão, em tela cheia quando suportado pelo navegador. Use as setas ou Page Up/Page Down para navegar; Home/End vão ao início/fim. O roteiro de fala fica oculto e pode ser aberto manualmente (aparece também na TV). O botão Sair encerra a apresentação.

## Calendário de apuração

Cada semana tem sete dias, de segunda a domingo, e pertence ao mês em que começa sua segunda-feira. A última semana continua até o domingo seguinte sem ser dividida nem repetida no próximo mês. A numeração recomeça a cada mês.

- Outubro/2026: 05/10–11/10, 12/10–18/10, 19/10–25/10 e 26/10–01/11.
- Novembro/2026: a 5ª semana é 30/11–06/12.
- Dezembro/2026: a 1ª semana começa em 07/12.

A confirmação de propriedade de novembro prevalece sobre a regra inicial que permitia a primeira semana começar no mês anterior. A interface calcula automaticamente quatro ou cinco semanas. Lançamentos antigos exigem conferência das datas antes de serem apresentados; valores fora do calendário não são descartados automaticamente.

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

O site não precisa de D1, segredos, integrações ou variáveis de ambiente. A publicação contém apenas o aplicativo e os exemplos simulados. Fontes usam Google Fonts com alternativa local de sistema.
