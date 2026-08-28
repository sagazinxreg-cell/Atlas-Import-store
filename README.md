# Atlas Finance Hub

Quero começar a construir um aplicativo chamado:

ATLAS STORE — IMPORT & PROFIT

Este será um sistema privado de gestão financeira e operacional para minha loja Atlas Store, que trabalha com importação e venda de roupas, tênis e acessórios.

IMPORTANTE:

Neste primeiro passo NÃO quero que você tente construir todas as funcionalidades do aplicativo.

Quero que você construa uma base profissional, escalável e bem organizada para receber as funcionalidades posteriormente.

==================================================

IDENTIDADE VISUAL

==================================================

A identidade da Atlas Store utiliza:

Preto: #000000

Amarelo principal: #FFD400

Branco: #FFFFFF

O design deve ser:

- moderno

- premium

- minimalista

- inspirado em streetwear

- profissional

- limpo

- responsivo

- mobile-first

O amarelo #FFD400 deve ser usado para destaques, botões principais, indicadores positivos e elementos importantes.

Não exagerar no amarelo.

==================================================

ESTRUTURA

==================================================

Criar a aplicação com as seguintes páginas principais:

1. Dashboard

2. Importações

3. USCloser

4. CSSBuy

5. Produtos

6. Vendas

7. Metas

8. Financeiro

9. Histórico

10. Configurações

Criar uma navegação moderna.

No desktop, utilizar sidebar.

No celular, utilizar uma navegação apropriada para mobile, podendo ser bottom navigation ou menu lateral.

==================================================

DASHBOARD INICIAL

==================================================

Criar uma primeira versão visual do Dashboard com cards para:

- Capital investido

- Custo total das importações

- Receita potencial

- Lucro potencial

- Lucro disponível

- Reinvestimento

Também criar uma seção:

"Meta atual"

com:

- nome da meta

- valor da meta

- progresso

- valor restante

- quantidade de peças necessárias

Por enquanto os dados podem ser mockados, pois ainda construiremos o banco de dados e as funções posteriormente.

==================================================

IMPORTANTE

==================================================

Não crie ainda cálculos financeiros complexos.

Não invente fórmulas tributárias.

Não implemente ainda USCloser ou CSSBuy.

Neste momento quero somente uma base visual e estrutural profissional.

Organize o código de forma modular para que posteriormente possamos adicionar:

- banco de dados

- autenticação

- calculadoras

- produtos

- vendas

- metas

- relatórios

- histórico

Sem precisar reconstruir o projeto.

Priorize qualidade de código, responsividade e UX.

Depois de implementar, explique resumidamente a estrutura criada e aguarde meu próximo comando.

## Prompt 2 - Banco de Dados

Agora quero criar a estrutura de dados da aplicação.

Não altere desnecessariamente o design que já foi criado.

Crie uma arquitetura de banco de dados preparada para uma aplicação real.

Entidades principais:

USER
PRODUCT
IMPORTATION
IMPORTATION_ITEM
SALE
SALE_ITEM
GOAL
EXPENSE
CURRENCY_RATE
SUPPLIER
SETTINGS

==================================================
PRODUCT
==================================================

Campos:

- id
- name
- brand
- category
- size
- color
- supplier_id
- country
- import_method
- purchase_price
- import_cost
- total_cost
- sale_price
- quantity
- image
- notes
- created_at
- updated_at

==================================================
IMPORTATION
==================================================

Campos:

- id
- method
- supplier
- origin_country
- currency
- exchange_rate
- product_total
- shipping_cost
- taxes
- fees
- insurance
- total_cost
- status
- notes
- created_at
- updated_at

==================================================
SALE
==================================================

Campos:

- id
- product_id
- quantity
- sale_price
- payment_fee
- other_costs
- total_revenue
- total_cost
- gross_profit
- available_profit
- reinvestment_profit
- date

==================================================
GOAL
==================================================

Campos:

- id
- name
- target_amount
- current_amount
- deadline
- status
- created_at

==================================================
SETTINGS
==================================================

Criar configurações para:

- reinvestment_percentage
- available_profit_percentage
- USD exchange rate
- CNY exchange rate
- import tax
- ICMS
- payment fee
- other fees

O padrão da divisão de lucro deverá ser:

50% disponível
50% reinvestimento

Mas deve ser totalmente configurável.

==================================================
IMPORTANTE
==================================================

Criar relacionamentos corretamente.

Garantir que os dados de cada usuário sejam isolados.

Não colocar valores financeiros importantes apenas no frontend.

Preparar a arquitetura para cálculos realizados de forma confiável.

Não implemente ainda as calculadoras.

Primeiro quero a estrutura de dados funcionando corretamente.

## Prompt 3 - Dashboard Real

Agora quero transformar o Dashboard em um Dashboard REAL.

Utilize os dados do banco de dados que acabamos de criar.

Não utilize mais dados mockados quando houver dados reais disponíveis.

==================================================
CARDS
==================================================

Mostrar:

Capital investido
= total efetivamente investido nas importações.

Custo total
= custo real das importações.

Receita potencial
= quantidade de produtos disponíveis × preço de venda cadastrado.

Lucro potencial
= receita potencial - custo real.

Lucro disponível
= lucro × percentual configurado para retirada.

Reinvestimento
= lucro × percentual configurado para reinvestimento.

==================================================
META
==================================================

Mostrar a meta ativa do usuário.

Exibir:

- nome
- valor
- progresso
- valor acumulado
- valor restante
- quantidade estimada de peças restantes

==================================================
DESIGN
==================================================

Manter a identidade:

#000000
#FFD400
#FFFFFF

Criar gráficos simples e profissionais.

Mostrar estados vazios quando ainda não houver dados.

Exemplo:

"Nenhuma importação cadastrada ainda."

Adicionar CTA:

"Nova importação"

O Dashboard deve funcionar perfeitamente no celular.

## Prompt 4 - Calculadora USCloser

Agora quero implementar a calculadora:

🇺🇸 USCloser → Brasil

As imagens anexadas são referências visuais e funcionais da calculadora que utilizo atualmente.

Analise as imagens cuidadosamente.

Quero que você reproduza a lógica dos campos e a organização das informações, mas NÃO copie a identidade visual da calculadora.

A calculadora deve seguir exclusivamente a identidade visual da Atlas Store:

Preto #000000

Amarelo #FFD400

Branco #FFFFFF

==================================================

CAMPOS

==================================================

Criar:

1. Valor pago pelo produto — USD, obrigatório.
2. Valor declarado do produto — USD, preenchido inicialmente com o valor pago, mas editável.
3. Peso considerado no envio — lb, valor padrão 1.
4. Frete declarado — USD, opcional.
5. Valor do item no Brasil — BRL, opcional, usado apenas para comparação.
6. Dólar comercial — BRL, editável, com botão "ATUALIZAR DÓLAR".

==================================================

RESULTADO

==================================================

Criar uma seção CUSTO FINAL ESTIMADO mostrando:

- Produto
- Frete
- Imposto de importação
- ICMS
- Outras taxas
- Custo total

==================================================

IMPORTANTE SOBRE TRIBUTAÇÃO

==================================================

NÃO invente novas fórmulas.

As imagens de referência apresentam determinadas alíquotas, porém as regras tributárias podem variar.

Portanto:

- criar imposto de importação como configuração editável;
- criar ICMS como configuração editável;
- criar outras taxas como configuração editável.

O sistema deve deixar claro que o resultado é uma estimativa.

Não criar qualquer recurso relacionado a subfaturamento, falsificação de declaração ou evasão fiscal.

==================================================

TRANSPARÊNCIA

==================================================

Criar "Como o cálculo foi feito", mostrando passo a passo:

Produto + Frete + Base tributável + Impostos + Taxas = Custo final

Quero conseguir entender exatamente de onde veio cada valor.

==================================================

ARQUITETURA

==================================================

Criar um módulo separado para a lógica: USCloserCalculator.

Não espalhar as fórmulas pelos componentes da interface.

Isso permitirá alterar as regras posteriormente.

Antes de finalizar, teste a calculadora com valores fictícios e confirme que não existem erros matemáticos.



This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c78b60a7-b22a-4d1b-8076-588692f99343).

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

## Prompt 5 - Calculadora CSSBuy

Agora quero criar uma segunda calculadora independente:

🇨🇳 CSSBuy → Brasil

Esta calculadora deve ser separada da USCloser.

A moeda principal de compra será:

CNY / ¥

==================================================

CAMPOS

==================================================

Criar:

- Valor do produto

- Frete doméstico na China

- Taxa de serviço CSSBuy

- Outros custos na China

- Peso

- Frete internacional

- Seguro

- Valor declarado

- Cotação do Yuan

- Impostos

- Outras taxas

Permitir unidades:

kg

g

Fazer conversão automaticamente quando necessário.

==================================================

COTAÇÃO

==================================================

Criar campo:

Cotação do Yuan

Exemplo:

R$ 0,XX

Criar botão:

"ATUALIZAR COTAÇÃO"

Por enquanto permitir alteração manual.

Preparar arquitetura para futuramente utilizar API.

==================================================

RESULTADO

==================================================

Mostrar:

Produto

Frete China

Taxa CSSBuy

Frete internacional

Seguro

Impostos

Outras taxas

CUSTO FINAL

E também:

CUSTO POR PEÇA

==================================================

IMPORTANTE

==================================================

Não copiar fórmulas da USCloser.

USCloser e CSSBuy devem possuir motores de cálculo independentes.

Criar:

CSSBuyCalculator

para toda a lógica.

Não hardcodar taxas tributárias.

Deixar configurações editáveis.

Adicionar explicação detalhada de como o custo foi formado.

## Prompt 6 - Comparar USCloser vs CSSBuy

Agora crie uma ferramenta:

COMPARAR IMPORTAÇÃO

Quero conseguir comparar o custo do mesmo produto utilizando:

🇺🇸 USCloser

versus

🇨🇳 CSSBuy

O usuário poderá preencher os dados das duas calculadoras.

Mostrar:

Método

Custo do produto

Frete

Impostos

Taxas

Custo final

Custo por peça

Depois mostrar:

"MELHOR OPÇÃO"

Destacar automaticamente a opção de menor custo.

Também mostrar:

Diferença em reais.

Exemplo:

USCloser

R$ 420

CSSBuy

R$ 385

Resultado:

CSSBuy é R$ 35 mais barato.

Também mostrar a diferença percentual.

Manter todos os cálculos independentes.

Não modificar as calculadoras existentes de maneira que quebre suas funções.


## Prompt 7 - Produtos

Agora quero criar o módulo:

📦 PRODUTOS

Criar uma página completa para cadastrar e gerenciar meus produtos.

Campos:

- Nome
- Marca
- Categoria
- Tamanho
- Cor
- Fornecedor
- País de origem
- Método de importação
- Custo do produto
- Custo de importação
- Custo total
- Custo por peça
- Preço de venda
- Quantidade
- Foto
- Observações

Categorias:

- Camiseta
- Blusa
- Moletom
- Bermuda
- Calça
- Tênis
- Boné
- Jaqueta
- Outros

==================================================

CUSTO REAL

==================================================

O custo total deve considerar:

Produto + Frete + Impostos + Taxas + Outros custos

Se uma importação tiver várias peças, distribuir corretamente os custos compartilhados para obter um custo médio por peça.

Exemplo:

10 peças
Produtos: R$1.000
Frete: R$300
Impostos: R$400
Taxas: R$100

Total: R$1.800

Custo médio: R$180 por peça.

Nunca considerar automaticamente apenas o preço de compra como custo final.
