ALTER TABLE produtos DISABLE ROW LEVEL SECURITY;
ALTER TABLE vendas DISABLE ROW LEVEL SECURITY;
ALTER TABLE venda_itens DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "acesso_publico_produtos" ON produtos;
DROP POLICY IF EXISTS "acesso_publico_vendas" ON vendas;
DROP POLICY IF EXISTS "acesso_publico_venda_itens" ON venda_itens;

ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE venda_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuarios_logados_produtos" ON produtos
  FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "usuarios_logados_vendas" ON vendas
  FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "usuarios_logados_venda_itens" ON venda_itens
  FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
