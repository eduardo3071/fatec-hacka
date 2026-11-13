# Backend — Colheita Certa (Fase 1)

API em FastAPI + SQLAlchemy sobre o Postgres do Supabase (projeto FATEC-Hacka). Pedido por toque, lista de colheita e rota por regras, ganho a mais contra o intermediário, e IA só para voz (pedido) e voz ou foto (catálogo). Contexto e decisões em `../../arquitetura.md` e `../../fases.md` (pasta do planejamento).

## Rodar localmente

```sh
cd backend
py -3.12 -m venv .venv
.venv\Scripts\pip install -r requirements.txt
copy .env.example .env      # preencha; o .env não vai para o Git
.venv\Scripts\python -m pytest            # testes (SQLite em memória, IA simulada)
.venv\Scripts\uvicorn app.main:app --reload
```

Documentação interativa: http://localhost:8000/docs · contrato OpenAPI: http://localhost:8000/openapi.json (é o que o Lovable lê na Fase 2).

Com `DATABASE_URL=sqlite:///./dev.db` a API sobe sem Supabase, mas as tabelas só existem se você as criar: em desenvolvimento rápido, `python -c "from app.db import get_engine; from app.models import Base; Base.metadata.create_all(get_engine())"`.

## Banco

O schema vive em `sql/` e é aplicado **pelo chat do Lovable** (regra do `AGENTS.md` do repositório). Passo a passo em `LOVABLE_PROMPT.md`. O backend conecta direto no Postgres com `DATABASE_URL` (pooler de transação, porta 6543, sem prepared statements; já tratado em `app/db.py`). Esse papel ignora o RLS, então **toda autorização está no código** (cada rota filtra pelo produtor logado). O RLS protege só o que o frontend lê direto com supabase-js.

## Rotas

| Quem | Rota | O que faz |
|---|---|---|
| Comprador (sem login) | `GET /public/{slug}/catalog` | Catálogo ativo e Pix do produtor |
| | `POST /public/{slug}/orders` | Cria pedido (limite de 5 por aparelho por hora) |
| | `GET /public/orders/{token}` | Acompanha o pedido |
| | `GET /public/{slug}/last-order` | Repetir último pedido (exige telefone e aparelho) |
| | `POST /public/{slug}/voice-order` | Áudio vira **rascunho** de carrinho (nada é gravado) |
| Produtor (JWT do Supabase) | `POST/GET/PATCH /producer` | Perfil e link (`slug`) |
| | `GET/POST/PATCH/DELETE /products` | Catálogo (DELETE desativa) |
| | `GET /orders`, `POST /orders/{id}/accept\|reject\|deliver\|cancel\|pay` | Fluxo do pedido |
| | `GET /harvest?date=` | Lista de colheita por produto e unidade, e rota por horário |
| | `GET /earnings?month=AAAA-MM` | Ganho a mais contra o preço do intermediário |
| | `GET /usage?month=AAAA-MM` | Custo real de IA do mês |
| | `POST /ai/catalog/voice`, `POST /ai/catalog/photo` | Proposta de catálogo (o produtor confirma) |
| | `POST /push/subscribe`, `GET /push/public-key` | Avisos de novo pedido |

Fluxo de status: `pendente → aceito → entregue` (ou `recusado`, `cancelado`). O pagamento (`a_receber → pago`) é separado e direto no Pix do produtor.

## Decisões

- **A IA nunca grava.** Voz e foto devolvem rascunho; o comprador confirma o carrinho e o produtor confirma os produtos.
- **Interface de provedor** (`app/ai/provider.py`): trocar o modelo é trocar uma classe. Modelo de texto `claude-haiku-5-5`, de foto `claude-sonnet-5-5`, transcrição `gpt-4o-mini-transcribe`.
- **Custo medido por chamada** na tabela `usage_events`, com as tarifas de `app/config.py` (consultadas em 13/11/2026) e câmbio de R$ 5,50.
- **Preço do intermediário** fica gravado em cada item do pedido, então o ganho a mais não muda se o preço mudar depois.

## Limites conhecidos

- A duração do áudio, usada só para estimar o custo de transcrição, vem do cliente (`duration_seconds`) ou é estimada pelo tamanho do arquivo. A cobrança real é a da OpenAI.
- As chamadas à Anthropic e à OpenAI **não foram testadas com chaves reais** (os testes usam IA simulada). Teste voz e foto com uma chave antes da demo.
- Aviso por push só funciona com as chaves VAPID configuradas (`python -m app.notifications.generate_vapid`). Sem elas, o pedido segue normalmente.
- Autorização e limites por aparelho são de nível MVP: o `device_id` é gerado pelo navegador e pode ser trocado por quem queira burlar o limite.
- Os testes rodam em SQLite; as constraints e o RLS do Postgres só são exercitados quando o SQL de `sql/` for aplicado no Supabase.
