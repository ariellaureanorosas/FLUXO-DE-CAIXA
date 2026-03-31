# PDVFlow

Sistema de Ponto de Venda (PDV) e fluxo de caixa com banco de dados em nuvem via Supabase e autenticação.

## Funcionalidades

- **Login seguro** — autenticação via Supabase Auth (email/senha), com verificação de sessão persistente
- **Cadastro de Produtos** — criar, editar e excluir produtos com nome, preço e estoque
- **PDV / Vendas** — carrinho de compras com controle de estoque em tempo real, cálculo de troco e finalização de venda
- **Dashboard** — cards de resumo (total em vendas, número de transações, produtos cadastrados, alertas de estoque), histórico das últimas 10 vendas e exportação de PDF
- **Banco de dados Supabase** — dados persistidos na nuvem (PostgreSQL), sincronizados em tempo real entre múltiplos dispositivos
- **Segurança** — políticas RLS no banco exigem autenticação para qualquer operação
- **Reset de sistema** — botão para limpar todos os dados com confirmação

## Stack

| Tecnologia | Uso |
|---|---|
| [React 19](https://react.dev/) | Interface |
| [Vite 8](https://vitejs.dev/) | Build e dev server |
| [Tailwind CSS 4](https://tailwindcss.com/) | Estilização |
| [Supabase](https://supabase.com/) | Banco de dados, autenticação, realtime |
| [Lucide React](https://lucide.dev/) | Ícones |
| [jsPDF](https://parall.ax/products/jspdf) | Geração de PDF |

## Pré-requisitos

- [Node.js](https://nodejs.org/) 18+
- Conta no [Supabase](https://supabase.com/)

## Configuração

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar o Supabase

Crie um projeto no [Supabase](https://supabase.com/) e execute o SQL abaixo no **SQL Editor** do painel:

```sql
-- Tabelas
CREATE TABLE produtos (
  id BIGSERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  preco NUMERIC(10,2) NOT NULL,
  estoque INTEGER NOT NULL DEFAULT 0,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vendas (
  id BIGSERIAL PRIMARY KEY,
  total NUMERIC(10,2) NOT NULL,
  valor_recebido NUMERIC(10,2),
  troco NUMERIC(10,2),
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE venda_itens (
  id BIGSERIAL PRIMARY KEY,
  venda_id BIGINT REFERENCES vendas(id) ON DELETE CASCADE,
  produto_id BIGINT REFERENCES produtos(id),
  nome_produto TEXT NOT NULL,
  preco_unitario NUMERIC(10,2) NOT NULL,
  quantidade INTEGER NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL
);

-- RLS (segurança)
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE venda_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuarios_logados_produtos" ON produtos
  FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "usuarios_logados_vendas" ON vendas
  FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "usuarios_logados_venda_itens" ON venda_itens
  FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE produtos;
ALTER PUBLICATION supabase_realtime ADD TABLE vendas;
ALTER PUBLICATION supabase_realtime ADD TABLE venda_itens;

-- Dados de exemplo (opcional)
INSERT INTO produtos (nome, preco, estoque) VALUES
  ('Café Expresso', 5.50, 30),
  ('Pão de Queijo', 3.00, 8),
  ('Suco de Laranja', 7.00, 2);
```

### 3. Criar usuário de acesso

No painel do Supabase, vá em **Authentication → Users → Add user** e crie um email/senha para acesso ao sistema.

### 4. Configurar credenciais

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-aqui
```

As credenciais ficam em **Supabase → Settings → API**.

### 5. Rodar

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview
```

## Segurança

- O login é validado pelo **Supabase Auth** (não pelo código do navegador)
- As **políticas RLS** no banco de dados exigem autenticação para qualquer operação de leitura ou escrita
- Mesmo com a anon key, sem login não é possível acessar os dados
- As credenciais ficam em arquivo `.env` que não é enviado ao repositório

## Estrutura do projeto

```
pdv-system/
├── src/
│   ├── App.jsx          # Componente principal (toda a aplicação)
│   ├── main.jsx         # Entry point do React
│   └── index.css        # Estilos globais e animações
├── .env                 # Credenciais do Supabase (não versionado)
├── index.html
├── package.json
└── vite.config.js
```

## Licença

MIT
