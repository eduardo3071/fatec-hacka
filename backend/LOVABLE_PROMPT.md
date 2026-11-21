# Como criar o schema do banco pelo Lovable

> A versão **em ordem** (com o SQL já embutido, pronta para copiar) está em `docs/lovable-visual.md`, nos prompts 2 e 3. Este arquivo continua valendo como referência.

O `AGENTS.md` deste repositório pede que o schema seja alterado pelo Lovable, não por `supabase/migrations/`. Então:

1. Abra o projeto no Lovable (o link está no README da raiz).
2. Cole no chat a mensagem abaixo, seguida do conteúdo de `backend/sql/001_schema.sql`.
3. Quando o Lovable terminar, cole outra mensagem com o conteúdo de `backend/sql/002_rls.sql`.
4. Confira no painel do Supabase que as 7 tabelas existem e que o RLS está ligado em todas.
5. Crie um usuário de teste (login do app ou painel do Supabase), troque o e-mail em `003_seed_demo.sql` e rode no editor SQL, se quiser os dados de demonstração.

## Mensagem para o Lovable (parte 1)

> Preciso de uma migração no banco do projeto. Execute exatamente o SQL abaixo, sem renomear tabelas nem colunas, porque um backend em Python vai ler e gravar essas tabelas. Depois me diga quais tabelas foram criadas.
>
> (cole aqui o conteúdo de `backend/sql/001_schema.sql`)

## Mensagem para o Lovable (parte 2)

> Agora aplique estas políticas de segurança por linha. Não crie nenhuma política para o papel anon: visitantes não devem ler nada direto do banco. O frontend só lê os dados do próprio produtor logado; toda escrita passa pelo backend.
>
> (cole aqui o conteúdo de `backend/sql/002_rls.sql`)

## Depois de aplicar

- Peça ao Lovable para regenerar `src/integrations/supabase/types.ts`, para o frontend enxergar as tabelas.
- O backend não usa esse arquivo. Ele conecta direto no Postgres (`DATABASE_URL`, pooler de transação, porta 6543).
- A chave de serviço e a senha do banco ficam só no ambiente do backend (Vercel) e no `.env` local dele, que está no `.gitignore`. Nunca no repositório.
