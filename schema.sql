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

ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE venda_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "acesso_publico_produtos" ON produtos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "acesso_publico_vendas" ON vendas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "acesso_publico_venda_itens" ON venda_itens FOR ALL USING (true) WITH CHECK (true);
