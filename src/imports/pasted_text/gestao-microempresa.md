Crie o protótipo completo de um sistema web de gestão para uma microempresa que trabalha com capas, películas e acessórios para celulares.

O sistema deve ter uma interface moderna, profissional, limpa, intuitiva e responsiva, pensada para ser utilizada principalmente em computador, mas funcionando também em tablet e celular.

O sistema será utilizado posteriormente como base para desenvolvimento em JavaScript com armazenamento local (localStorage), portanto organize as telas de forma coerente com um sistema real de gestão.

## OBJETIVO DO SISTEMA

O sistema deve permitir controlar:

* Cadastro de produtos
* Estoque
* Entradas de produtos
* Saídas/vendas
* Reposição de estoque
* Rotatividade dos produtos
* Controle financeiro
* Caixa
* Vendedores
* Desempenho individual dos vendedores
* Relatórios
* Exportação de dados para planilhas
* Histórico das movimentações

O sistema deve conectar todas essas informações.

Quando uma venda for registrada, por exemplo:

* A quantidade do produto deve diminuir no estoque
* A venda deve ser registrada
* O vendedor responsável deve ser identificado
* O valor efetivamente vendido deve ser registrado
* Descontos devem ser considerados
* A forma de pagamento deve ser registrada
* O lucro real deve ser calculado
* O caixa deve ser atualizado
* Data e horário devem ser registrados automaticamente

## PERFIS DE USUÁRIO

Criar dois tipos de usuários:

### ADMINISTRADOR

Possui acesso completo ao sistema.

Pode:

* Cadastrar produtos
* Editar produtos
* Desativar produtos
* Registrar entradas
* Visualizar estoque
* Registrar vendas
* Visualizar todas as vendas
* Cadastrar vendedores
* Editar vendedores
* Ativar/desativar vendedores
* Visualizar desempenho dos vendedores
* Visualizar financeiro
* Visualizar caixa
* Visualizar relatórios
* Exportar dados
* Cancelar/estornar vendas
* Consultar histórico das movimentações

### VENDEDOR

Possui acesso limitado.

Pode:

* Registrar vendas
* Pesquisar produtos
* Consultar disponibilidade dos produtos
* Visualizar suas próprias vendas
* Visualizar seu desempenho
* Consultar informações necessárias para realizar vendas

Não deve ter acesso às configurações administrativas, financeiro geral, cadastro de vendedores ou informações sensíveis da empresa.

## TELAS DO SISTEMA

Criar as seguintes telas:

### 1. LOGIN

Tela inicial com:

* Logo da empresa
* Nome do sistema
* Campo usuário
* Campo senha
* Botão Entrar
* Opção mostrar/ocultar senha

Criar uma aparência profissional e simples.

---

### 2. DASHBOARD DO ADMINISTRADOR

Criar uma dashboard com visão geral da empresa.

Mostrar cards com:

* Vendas de hoje
* Faturamento de hoje
* Lucro bruto de hoje
* Produtos em estoque
* Produtos para reposição
* Produtos com baixa rotatividade
* Quantidade de vendas

Criar também:

* Gráfico de vendas
* Gráfico de faturamento
* Produtos mais vendidos
* Produtos com pouca rotatividade
* Produtos que precisam ser repostos
* Ranking de vendedores

Adicionar atalhos rápidos:

* Registrar venda
* Cadastrar produto
* Ver estoque
* Ver financeiro
* Ver vendedores

---

### 3. DASHBOARD DO VENDEDOR

Mostrar somente informações relacionadas ao próprio vendedor.

Cards:

* Vendas de hoje
* Valor vendido hoje
* Vendas da semana
* Vendas do mês

Adicionar:

* Botão Registrar venda
* Minhas vendas recentes
* Produtos disponíveis

Não mostrar informações financeiras gerais da empresa.

---

### 4. ESTOQUE

Criar uma página completa de gerenciamento de estoque.

No topo:

* Título Estoque
* Barra de pesquisa
* Botão Cadastrar produto
* Botão Exportar estoque

A barra de pesquisa deve permitir procurar por:

* Nome
* Código/SKU
* Categoria
* Modelo do celular
* Compatibilidade

Adicionar filtros:

* Todos
* Disponíveis
* Estoque baixo
* Sem estoque
* Categoria
* Rotatividade

Criar tabela com:

* Código
* Produto
* Categoria
* Modelo/compatibilidade
* Quantidade atual
* Estoque mínimo
* Estoque ideal
* Custo
* Preço de venda
* Status
* Rotatividade
* Ações

As ações devem permitir:

* Visualizar
* Editar
* Registrar entrada
* Ver histórico

---

### 5. CADASTRO DE PRODUTO

Criar formulário contendo:

* Nome do produto
* Código/SKU
* Categoria
* Marca
* Modelo/compatibilidade
* Descrição
* Valor de custo
* Valor de venda sugerido
* Estoque inicial
* Estoque mínimo
* Estoque ideal
* Fornecedor
* Data de entrada

Mostrar automaticamente:

* Margem de lucro
* Lucro estimado por unidade

Exemplo:

Custo: R$ 8,00
Venda: R$ 25,00
Lucro estimado: R$ 17,00
Margem: 68%

---

### 6. DETALHES DO PRODUTO

Criar uma página/modal detalhada do produto.

Mostrar:

* Nome
* Código
* Categoria
* Estoque atual
* Estoque mínimo
* Estoque ideal
* Custo
* Preço sugerido
* Lucro estimado
* Total comprado
* Total vendido
* Lucro acumulado
* Última entrada
* Última venda
* Rotatividade

Criar histórico de movimentações:

* Data
* Horário
* Tipo de operação
* Quantidade
* Valor
* Usuário responsável

---

### 7. PRODUTOS PARA REPOR

Criar uma página exclusiva para produtos que atingiram ou ficaram abaixo do estoque mínimo.

Mostrar:

* Produto
* Estoque atual
* Estoque mínimo
* Estoque ideal
* Quantidade recomendada para compra
* Última entrada
* Última venda
* Prioridade

A quantidade recomendada deve seguir:

Estoque ideal - estoque atual

Criar indicadores de prioridade:

* Alta
* Média
* Baixa

Adicionar botão:

"Exportar lista de reposição"

---

### 8. PRODUTOS COM POUCA ROTATIVIDADE

Criar uma página exclusiva para produtos que vendem pouco ou estão parados.

Mostrar:

* Produto
* Estoque atual
* Quantidade vendida
* Última venda
* Dias sem venda
* Tempo no estoque
* Rotatividade
* Valor parado em estoque

Classificar:

* Boa
* Normal
* Baixa
* Parado

Produtos sem venda por mais de 3 meses devem receber destaque como "Baixa rotatividade" ou "Produto parado".

Adicionar filtros:

* Mais de 30 dias
* Mais de 60 dias
* Mais de 90 dias

Adicionar botão para exportar relatório.

---

### 9. REGISTRAR VENDA

Criar uma tela extremamente rápida e simples para o vendedor.

Adicionar:

* Barra de pesquisa de produtos
* Lista de produtos encontrados
* Quantidade disponível
* Preço cadastrado
* Quantidade da venda
* Desconto
* Valor final
* Forma de pagamento

Formas de pagamento:

* Dinheiro
* PIX
* Débito
* Crédito
* Outros

Mostrar resumo da venda:

Produto
Quantidade
Preço original
Desconto
Valor final
Lucro estimado

Ao confirmar:

* Baixar estoque
* Registrar venda
* Registrar vendedor
* Registrar data
* Registrar horário
* Atualizar caixa

Se o estoque for insuficiente, mostrar um alerta claro e impedir a venda.

---

### 10. HISTÓRICO DE VENDAS

Criar uma página para o administrador visualizar todas as vendas.

Filtros:

* Data
* Período
* Vendedor
* Produto
* Categoria
* Forma de pagamento

Tabela:

* Data
* Horário
* Vendedor
* Produto
* Quantidade
* Valor original
* Desconto
* Valor final
* Custo
* Lucro
* Forma de pagamento
* Status

Adicionar:

"Exportar vendas"

---

### 11. VENDEDORES

Criar uma página exclusiva para gerenciamento dos vendedores.

Mostrar lista com:

* Nome
* Status
* Data de cadastro
* Vendas
* Faturamento
* Lucro

Botão:

"Cadastrar vendedor"

Cadastro:

* Nome
* Usuário
* Senha
* Status

Criar página/modal de detalhes do vendedor.

Mostrar:

* Total de vendas
* Produtos vendidos
* Faturamento
* Descontos concedidos
* Lucro bruto
* Vendas do dia
* Vendas da semana
* Vendas do mês

Criar ranking de vendedores.

---

### 12. VENDAS POR VENDEDOR

Criar uma página onde o administrador possa selecionar:

Vendedor:
[Selecionar vendedor]

Período:
[Data inicial] até [Data final]

Mostrar:

* Quantidade de vendas
* Produtos vendidos
* Faturamento
* Descontos
* Lucro

Adicionar botão:

"Baixar vendas deste vendedor"

A exportação deve gerar uma planilha contendo as vendas daquele funcionário.

Também adicionar:

"Baixar relatório de todos os vendedores"

---

### 13. FINANCEIRO

Criar página financeira completa.

Filtros:

* Hoje
* Semana
* Mês
* Ano
* Período personalizado

Cards:

* Faturamento
* Custo dos produtos vendidos
* Lucro bruto
* Descontos
* Quantidade de vendas

Mostrar gráficos de:

* Faturamento
* Lucro
* Vendas
* Formas de pagamento

---

### 14. CAIXA

Criar tela de fechamento de caixa.

Mostrar:

* Data
* Total em dinheiro
* Total PIX
* Total débito
* Total crédito
* Total geral
* Número de vendas
* Lucro bruto

Permitir visualizar:

* Diário
* Semanal
* Mensal
* Anual

Criar botão para exportar relatório.

---

### 15. RELATÓRIOS

Criar uma central de relatórios.

Relatórios:

* Estoque
* Vendas
* Vendas por vendedor
* Produtos mais vendidos
* Produtos com baixa rotatividade
* Produtos para reposição
* Financeiro
* Caixa
* Lucro

Todos os relatórios relevantes devem possuir opção:

"Exportar para Excel"

---

## PESQUISA

A pesquisa deve ser rápida e estar presente principalmente em:

* Estoque
* Registro de venda
* Produtos

Permitir busca por nome, SKU, categoria e modelo.

Na pesquisa de venda, mostrar claramente a quantidade disponível.

Exemplo:

Capa iPhone 15 Transparente
6 unidades disponíveis
R$ 25,00

---

## ALERTAS

Criar sistema visual de alertas:

* Estoque baixo
* Produto sem estoque
* Produto parado
* Baixa rotatividade
* Venda concluída
* Venda cancelada
* Estoque insuficiente

---

## DATA E HORÁRIO

Toda movimentação deve registrar automaticamente:

* Data
* Dia da semana
* Horário

Não criar campos para o usuário preencher manualmente quando essas informações puderem ser geradas automaticamente pelo sistema.

---

## HISTÓRICO E AUDITORIA

Toda operação importante deve manter histórico.

Exemplos:

* Produto cadastrado
* Entrada registrada
* Venda registrada
* Venda cancelada
* Produto alterado
* Estoque alterado
* Usuário responsável

Não apagar silenciosamente operações importantes.

---

## EXPORTAÇÃO

Criar botões de exportação visualmente claros.

Permitir exportar:

* Estoque completo
* Lista de produtos para reposição
* Produtos com baixa rotatividade
* Todas as vendas
* Vendas de um vendedor específico
* Vendas de todos os vendedores
* Financeiro
* Caixa
* Relatórios

Formato principal:

Excel (.xlsx)

Também considerar CSV.

---

## NAVEGAÇÃO

Para o administrador, criar menu lateral:

Dashboard
Estoque
Produtos
Produtos para Repor
Pouca Rotatividade
Vendas
Vendedores
Financeiro
Caixa
Relatórios
Configurações

Para o vendedor:

Dashboard
Registrar Venda
Minhas Vendas
Produtos

O menu deve ser simples, organizado e intuitivo.

## DESIGN

Criar um design profissional de sistema empresarial.

Priorizar:

* Clareza
* Boa hierarquia visual
* Facilidade de uso
* Poucos cliques
* Tabelas organizadas
* Cards informativos
* Gráficos simples
* Alertas visuais
* Responsividade

Não deixar a interface visualmente carregada.

Utilizar componentes consistentes:

* Botões
* Inputs
* Selects
* Modais
* Cards
* Tabelas
* Badges de status
* Alertas
* Gráficos
* Menus

Criar estados de:

* Normal
* Carregando
* Vazio
* Erro
* Sucesso
* Estoque baixo
* Sem estoque

## RESULTADO ESPERADO

Criar um protótipo navegável de alta fidelidade, simulando o funcionamento real do sistema.

Todas as páginas devem estar visualmente conectadas através da navegação.

Criar dados fictícios realistas para demonstrar o funcionamento do sistema, utilizando produtos como:

* Capas de iPhone
* Capas Samsung
* Películas
* Cabos USB-C
* Carregadores
* Fones
* Suportes
* Adaptadores

O objetivo é que o protótipo possa posteriormente ser utilizado como referência visual e funcional para o desenvolvimento do sistema em JavaScript com localStorage.
