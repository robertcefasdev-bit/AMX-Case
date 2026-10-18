# AMX Case — banco de dados (Neon) e segurança

## Como ativar (3 passos)
1. Suba todos os arquivos deste pacote para o repositório (substituindo os antigos). Pastas novas: `api/` e `db/`.
   Arquivos novos na raiz: `vercel.json` e `package.json` (atualizado).
2. Na Vercel: **Settings → Environment Variables** → confirme que existe `DATABASE_URL` (a integração do Neon cria sozinha).
   Recomendado: crie também `SESSION_SECRET` com um texto longo e aleatório (40+ caracteres).
3. Espere o deploy terminar e abra o site. As tabelas são criadas sozinhas no primeiro acesso.

## Primeiro acesso
- Usuário: `Elias` — senha inicial: `admin`
- O sistema obriga a trocar essa senha no primeiro login. **Faça isso logo após o deploy.**

## O que é seguro
- Senhas guardadas com hash (scrypt), nunca em texto puro.
- Sessão em cookie protegido (HttpOnly/Secure); o navegador não consegue ler.
- Permissões (admin/vendedor) conferidas no servidor em toda ação.
- Vendedor não recebe custo, lucro, fornecedor nem vendas de outros vendedores.
- Preço e estoque vêm do banco; venda baixa o estoque em transação (nunca negativo).
- Limite de tentativas no login e na senha de desconto (bloqueio de 15 minutos).
- A chave do banco (`DATABASE_URL`) fica só no servidor.

## Observações
- Só funciona no site publicado na Vercel (não no preview do editor).
- O deploy usa `pnpm install --no-frozen-lockfile` (veja `vercel.json`) para instalar a nova dependência.
- Região: se o Neon estiver em São Paulo, configure a região das funções da Vercel para São Paulo (gru1) para ficar mais rápido.
