# Roteiro para o Lovable: visual do Colheita Certa

Cinco prompts para colar no chat do Lovable, **na ordem**. Cada um termina com um critério de pronto: espere o Lovable acabar e confira a prévia antes de colar o próximo. Os prompts 1 a 4 usam dados de exemplo (nada de API); o 5 liga tudo ao backend depois que ele estiver publicado.

## Antes de começar

1. Aplique o schema do banco pelo chat do Lovable, seguindo `backend/LOVABLE_PROMPT.md`. Os prompts abaixo não criam tabelas.
2. Se o chat permitir anexar imagens, anexe a capa e o slide "Proposta de valor" do deck como referência de clima visual.
3. Não mude o framework nem as bibliotecas do projeto (TanStack Start, Tailwind 4, shadcn/ui). Os prompts já dizem isso ao Lovable.

## Identidade visual (já está dentro do Prompt 1)

| Papel | Valor | Uso |
|---|---|---|
| Verde-floresta | `#14301F` | Fundos escuros, títulos |
| Floresta 2 | `#1D4029` | Cartões sobre fundo escuro |
| Verde-folha escuro | `#2F6B2A` | Botão principal, barras de sucesso |
| Verde-folha | `#5E9B3C` | Detalhes, ícones |
| Creme | `#F6F1E4` | Fundo da página |
| Areia | `#EADFC6` | Fundo secundário |
| Papel | `#FFFBF0` | Cartões |
| Âmbar | `#EE9A3A` | Destaque; texto sobre âmbar sempre em verde-floresta |
| Ferrugem | `#A8480B` | Números grandes e rótulos sobre claro |
| Tinta | `#1D2B22` | Texto principal |
| Cinza-verde | `#4A5A4F` | Texto secundário |
| Linha | `#D9CDAE` | Bordas de 2 px |

Fontes: **Domine** (títulos e números grandes) e **DM Sans** (todo o resto). Marca: dois círculos sobrepostos, sol âmbar e folha verde, como na capa do deck. O nome "Colheita Certa" é provisório.

---

## Prompt 1: base visual (design system)

```
Vamos construir o visual de um app chamado "Colheita Certa": pedidos por toque para horticultores do Alto Tietê (SP) e seus compradores (restaurantes, mercadinhos, feirantes). Mantenha o framework e as bibliotecas que o projeto já usa (TanStack Start, Tailwind 4, shadcn/ui, lucide-react). NÃO crie tabelas nem chame API agora: use dados de exemplo.

OBJETIVO DESTE PASSO: só a base visual. Nenhuma tela de negócio ainda.

IDENTIDADE
- Clima: campo, manhã cedo, colheita. Quente, limpo, confiável. Nada de visual "tech" frio, nada de gradientes roxos, nada de glassmorphism.
- Marca: dois círculos sobrepostos, um sol âmbar (#EE9A3A) e uma folha verde (#5E9B3C), com o nome "Colheita Certa" em Domine bold ao lado. Crie o logo como componente SVG <Logo /> (variantes clara e escura).
- Fontes (Google Fonts): Domine (400–700) para títulos e números grandes; DM Sans (400–700) para o resto.

TOKENS (defina como variáveis CSS e no tema do Tailwind):
- forest #14301F, forest-2 #1D4029, leaf-dark #2F6B2A, leaf #5E9B3C
- cream #F6F1E4 (fundo da página), sand #EADFC6, paper #FFFBF0 (cartões)
- amber #EE9A3A, rust #A8480B, ink #1D2B22, muted #4A5A4F, line #D9CDAE
- Regras de contraste: texto sobre âmbar é SEMPRE forest; rust só como texto sobre fundo claro; texto secundário usa muted (nunca cinza claro). Tudo precisa ler bem sob sol forte no celular.

ESCALA E FORMA
- Tipografia: 4 tamanhos principais (números grandes 56–96px em Domine; título 28–36px; corpo 17–18px; rótulo 14–15px). Mínimo 14px em qualquer texto.
- Cartões: fundo paper, borda de 2px na cor line, raio 24px, padding generoso. Botões em pílula (raio total), altura mínima de 52px, alvo de toque de pelo menos 48px.
- Espaçamento em múltiplos de 8. Muito ar. Uma ideia por tela.

COMPONENTES (ajuste os do shadcn aos tokens e crie estes)
- Button: variantes primary (leaf-dark com texto creme), amber (texto forest), outline (borda forest), ghost, destructive (ferrugem). Estado de carregamento com spinner.
- Card, Chip/Pill (selecionável), Badge de status, Stepper de quantidade (− 1 +) com botões grandes e pequena animação de "pulo" ao mudar, BottomSheet (gaveta de baixo para cima), Toast, Skeleton, EmptyState (ícone grande + frase curta + ação), TimelineStatus, BigNumber (número grande em Domine com rótulo embaixo).
- Formatação pt-BR em todo lugar: "R$ 1.234,56", datas "amanhã, 14/11", horas "07:00". Crie utilitários formatMoney, formatDate, formatQty.

MOVIMENTO
- Sutil e rápido: entrada com fade e subida de 8px (200–300ms), listas com pequena defasagem, botão com leve afundar ao tocar. Respeite prefers-reduced-motion (sem animação nesse caso).

LAYOUT
- Mobile first. No desktop, o conteúdo do comprador fica centralizado numa coluna de até 480px sobre fundo areia; o painel do produtor usa barra de abas embaixo no celular e menu lateral no desktop.

PÁGINA DE AMOSTRA
- Crie uma rota /design que mostra todos os componentes, as cores e as fontes numa página bonita, em claro e em escuro (fundo forest com cartões forest-2). Use dados de exemplo.

DADOS DE EXEMPLO (src/lib/mock, com tipos TypeScript): produtos Alface crespa (maço, R$ 3,50), Couve (maço, R$ 3,00), Brócolis (maço, R$ 6,00), Cenoura (kg, R$ 4,00), Rúcula (maço, R$ 3,50); produtor "Marcos", Biritiba-Mirim; compradores "Restaurante A" e "Mercadinho B".

PRONTO QUANDO: a rota /design mostra o logo, a paleta, a tipografia e todos os componentes, sem texto ilegível e sem nada fora da paleta.
```

---

## Prompt 2: comprador (sem login)

```
Agora as telas do COMPRADOR, usando só os dados de exemplo. Sem login. O comprador chega por um link do produtor: /p/marcos-biritiba. Pense em um restaurante pedindo pelo celular em 30 segundos, com uma mão só.

TELA 1: VITRINE (/p/:slug)
- Topo com o nome do produtor ("Marcos"), o município e uma etiqueta "Entrega amanhã". Fundo forest com os dois círculos da marca como detalhe decorativo.
- Faixa de ações: botão "Repetir meu último pedido" (um toque preenche o carrinho) e botão redondo de microfone "Pedir falando".
- Lista de produtos em cartões grandes: ilustração simples do produto (use um ícone/emoji bem desenhado ou forma orgânica verde, nunca foto de banco de imagem genérica), nome, unidade ("maço") e preço grande. Stepper de quantidade (− 1 +) com alvo de toque enorme. Produto com quantidade > 0 ganha borda leaf e um leve destaque.
- Barra fixa embaixo: "Ver pedido · 3 itens · R$ 100,00" (aparece com animação quando o carrinho tem itens). Desabilitada se vazio.

TELA 2: PEDIR FALANDO (gaveta de baixo para cima)
- Estado 1: botão de gravar grande, âmbar, com ondas animadas enquanto grava e cronômetro. Texto de apoio: "Fale o pedido: 'vinte maços de alface e dez de couve, amanhã às sete'".
- Estado 2: "Entendi isto" com a transcrição e os itens como cartões editáveis (stepper), mais uma seção "Não entendi" (itens que a pessoa precisa escolher na lista). Botões: "Está certo, ir para o pedido" e "Gravar de novo".
- Use dados de exemplo para simular o resultado. Mostre estados de carregando e de erro ("Não consegui ouvir. Tente de novo ou escolha no catálogo").

TELA 3: PEDIDO (confirmação)
- Resumo dos itens com subtotal e total em número grande.
- Dia de entrega em chips (Hoje, Amanhã, Escolher data) e horário em chips (06:00, 06:30, 07:00 ... 12:00).
- Campos: nome e telefone (máscara brasileira), observação opcional. Lembre os dados do comprador para a próxima vez (localStorage).
- Botão grande "Confirmar pedido". Estado de envio com spinner.

TELA 4: ACOMPANHAR (/pedido/:token)
- Linha do tempo com 3 passos: "Pedido enviado", "Marcos aceitou", "Entregue", com o passo atual destacado e um texto curto de estado.
- Cartão "Pagar": mostra o valor, a chave Pix do produtor com botão "Copiar chave" (toast de confirmação) e um QR code, quando houver. Texto claro: "O pagamento vai direto para o Marcos."
- Estados: pendente, aceito, recusado ("O Marcos não conseguiu atender. Veja outros horários"), entregue, pago.

TOQUES DE CAPRICHO
- Ao confirmar o pedido, uma animação curta e calorosa (folha crescendo ou sol nascendo), nunca confete infantil.
- Estados vazios bonitos e frases curtas, no tom de quem fala com o freguês: "Nada no carrinho ainda. Que tal começar pela alface?"

PRONTO QUANDO: dá para fazer o fluxo inteiro (vitrine, voz simulada, pedido, acompanhar) no celular, só com dados de exemplo, sem nenhuma chamada de rede.
```

---

## Prompt 3: produtor (com login)

```
Agora as telas do PRODUTOR. Quem usa é um horticultor, muitas vezes no campo, no celular, com pouca paciência e sol na tela. Textos curtos, botões enormes, números grandes. Ainda com dados de exemplo (o login real vem depois).

ENTRADA E CADASTRO
- Tela de entrada com a marca, uma frase ("Venda direto, colha com a lista pronta") e botão "Entrar". Primeiro acesso leva a um cadastro em 3 passos curtos e bonitos: (1) seu nome e município, (2) o endereço do seu link (ex.: colheitacerta.app/p/marcos-biritiba, mostrando se está livre) e sua chave Pix, (3) seus produtos.
- Passo dos produtos: três caminhos em cartões grandes: "Cadastrar falando", "Cadastrar por foto" e "Adicionar um a um". Falando e foto mostram uma lista proposta (nome, unidade, preço; preço faltando em destaque) que a pessoa edita e confirma. Cada produto tem um campo opcional "Quanto o atravessador paga por esta unidade?" com texto de apoio: "Só para calcular quanto você ganha a mais vendendo direto. Ninguém vê."

NAVEGAÇÃO
- Barra de abas embaixo no celular (menu lateral no desktop) com 4 abas: Pedidos, Colheita, Rota, Ganhos. Ícone de menu com Meu link e Produtos.
- A aba Pedidos mostra um selo com a quantidade de pedidos novos.

PEDIDOS
- Seção "Novos" no topo: cada pedido num cartão com o comprador, dia e hora da entrega, itens resumidos, total, e dois botões enormes: "Aceitar" (leaf-dark) e "Recusar" (outline). Pedido novo entra no topo com animação e pulso suave. Mostre um aviso gentil para ativar as notificações ("Quero ser avisado de novo pedido").
- Abaixo, abas: Aceitos, Entregues, Recusados.

COLHEITA
- Seletor de dia (Hoje, Amanhã, escolher).
- Lista por produto com a QUANTIDADE TOTAL em número grande (Domine) e a unidade: "35 maços · Alface crespa". Ao tocar, abre quanto vai para cada comprador. Caixinha grande para marcar "colhido" (só no aparelho).
- Se houver pedidos pendentes naquele dia, um aviso âmbar: "2 pedidos esperando sua resposta".
- Botão "Compartilhar a lista" e estado vazio caprichado: "Sem colheita marcada para este dia."

ROTA
- Linha do tempo vertical por horário: parada, comprador, quantidade de itens, total e etiqueta "A receber" ou "Pago". Ações grandes: "Marcar entregue" e "Marcar pago". Toque no telefone abre a ligação.

GANHOS
- Seletor de mês. Número gigante em ferrugem: "R$ 340 a mais que com o intermediário". Barra de cobertura ("calculado sobre 70% das suas vendas, os produtos em que você informou o preço do atravessador") e, embaixo, total vendido no mês e pedidos entregues.
- Mensagem de valor, discreta: "Sua mensalidade de R$ 50 se pagou 6 vezes este mês."

MEU LINK
- Cartão de compartilhamento bonito: o endereço do link, QR code, "Copiar link" e "Compartilhar no WhatsApp" (abre o WhatsApp com uma mensagem pronta para os compradores).

PRODUTOS
- Lista editável: preço, unidade, ativar e desativar (nunca apagar). Botão para adicionar falando ou por foto.

PRONTO QUANDO: com dados de exemplo, dá para aceitar um pedido, ver a colheita do dia, a rota e os ganhos, e compartilhar o link, tudo legível ao ar livre no celular.
```

---

## Prompt 4: PWA e acabamento

```
Agora o acabamento e o app instalável.

PWA
- Transforme o app em PWA instalável: manifest com o nome "Colheita Certa", ícone gerado a partir da marca (dois círculos sobre fundo forest, em 192 e 512 px, e versão maskable), cor de tema #14301F, modo standalone, tela de abertura com a marca.
- Banner de instalação elegante no painel do produtor. No iPhone, mostre um passo a passo ilustrado ("Toque em Compartilhar, depois em Adicionar à Tela de Início"), porque o aviso de novo pedido só funciona com o app instalado.
- Service worker simples: o painel abre mesmo sem internet (mostra o último estado) e avisa quando está offline. Prepare a tela de pedir permissão de notificações, com explicação do porquê, sem ainda ligar o push real.

ACABAMENTO
- Revise todas as telas: espaçamento em múltiplos de 8, nenhum texto abaixo de 14px, contraste forte, alvos de toque de 48px ou mais, foco visível para teclado, rótulos acessíveis, e prefers-reduced-motion respeitado.
- Estados de carregamento (skeletons), vazio e erro em todas as listas. Mensagens de erro em português, curtas e sem culpa do usuário.
- Título e descrição de cada página, favicon da marca e imagem de compartilhamento (Open Graph) bonita, com o nome do produtor quando for a vitrine.
- Verifique em 360px, 390px e desktop. Corrija qualquer corte, rolagem horizontal ou sobreposição.

PRONTO QUANDO: o app instala no celular, abre sem erro offline e passa na revisão de contraste e de toque.
```

---

## Prompt 5: ligar à API (só depois que o backend estiver publicado)

Troque `SEU_ENDEREÇO_DA_API` pelo endereço publicado (Vercel). O contrato completo está em `{API}/openapi.json`.

```
Agora troque os dados de exemplo pela API real. A API está em SEU_ENDEREÇO_DA_API (guarde em VITE_API_URL; o contrato OpenAPI está em /openapi.json). NÃO crie nem altere tabelas: o schema já existe. Não coloque chaves secretas no código.

AUTENTICAÇÃO (produtor)
- Login com o Supabase Auth do projeto (e-mail e link mágico). Toda chamada às rotas do produtor leva o cabeçalho Authorization: Bearer <access_token da sessão>.
- Se a API responder 404 "Perfil de produtor ainda não criado", leve ao cadastro em 3 passos e envie POST /producer.

ROTAS DO COMPRADOR (sem login)
- GET /public/{slug}/catalog → nome, município, chave Pix e produtos ativos.
- POST /public/{slug}/orders → corpo: buyer_name, buyer_phone, device_id (gere um id aleatório no aparelho e guarde), delivery_date (AAAA-MM-DD), delivery_time (HH:MM), items [{product_id, quantity}], notes, source ("toque" ou "voz"). Responde com tracking_token: leve a /pedido/:token.
- GET /public/orders/{tracking_token} → status, itens, total, chave Pix.
- GET /public/{slug}/last-order?phone=&device_id= → itens para "Repetir meu último pedido" (itens com still_available=false aparecem desabilitados).
- POST /public/{slug}/voice-order (multipart: audio, device_id, duration_seconds) → RASCUNHO: transcript, items, unmatched, delivery_date, delivery_time. Nada é gravado até o comprador confirmar em POST /orders. Grave o áudio com MediaRecorder (webm).

ROTAS DO PRODUTOR (Bearer)
- GET/PATCH /producer; GET/POST /products, PATCH/DELETE /products/{id} (DELETE desativa).
- GET /orders?status=&date=; POST /orders/{id}/accept | reject | deliver | cancel | pay.
- GET /harvest?date=AAAA-MM-DD → items (total por produto e por comprador), route (paradas por horário), orders_accepted, orders_pending.
- GET /earnings?month=AAAA-MM → extra_gain, revenue, coverage_pct, orders_delivered.
- POST /ai/catalog/voice (multipart: audio) e POST /ai/catalog/photo (multipart: image) → proposta de produtos; o produtor edita e confirma com POST /products.
- GET /push/public-key e POST /push/subscribe (assinatura Web Push do navegador).

NOVOS PEDIDOS EM TEMPO REAL
- No painel, escute a tabela orders do Supabase com Realtime (as políticas de segurança já limitam ao produtor logado) e mostre o pedido novo no topo com a animação já criada.

ERROS
- A API devolve {"detail": "mensagem"} em português. Mostre a mensagem em toast. Trate 401 (volta ao login), 429 (muitos pedidos ou uso da IA: mensagem calma e ofereça o catálogo) e 502/503 da IA ("A IA está indisponível agora. Monte o pedido pelo catálogo").
- Se a rede cair, mantenha o último estado e avise.

Crie um cliente tipado em src/lib/api com os tipos do OpenAPI e remova os dados de exemplo de src/lib/mock quando tudo estiver ligado.

PRONTO QUANDO: com a API publicada, dá para criar produtor e produtos, abrir /p/:slug, pedir por toque e por voz, aceitar o pedido no painel e ver colheita, rota e ganhos com dados reais.
```

---

## Frases de ajuste para depois da prévia

- "Mais ar entre os cartões e títulos maiores, mantendo a paleta."
- "Os números grandes precisam ficar maiores e em Domine."
- "Aumente o contraste do texto secundário e dos botões ao ar livre."
- "Troque as ilustrações dos produtos por formas orgânicas mais bonitas e consistentes entre si."
- "Está parecendo um app genérico: traga mais do clima de campo (círculos da marca, tons quentes, cantos arredondados) sem poluir."
- "Reduza as animações; só o essencial."
