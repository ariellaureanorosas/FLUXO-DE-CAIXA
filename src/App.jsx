import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Package,
  ShoppingCart,
  BarChart3,
  Plus,
  Minus,
  Trash2,
  Edit3,
  Check,
  X,
  AlertTriangle,
  TrendingUp,
  CreditCard,
  ShoppingBag,
  CheckCircle2,
  ChevronRight,
  FileDown,
  RefreshCw,
  Loader2,
  Lock,
  LogOut,
  Mail,
} from 'lucide-react'
import { jsPDF } from 'jspdf'
import { createClient } from '@supabase/supabase-js'

/* ═══════════════════════════════════════════════════════════════
   SUPABASE CLIENT
   ═══════════════════════════════════════════════════════════════ */
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

/* ═══════════════════════════════════════════════════════════════
   CAMADA DE DADOS — Supabase
   ═══════════════════════════════════════════════════════════════ */
async function getProdutos() {
  const { data, error } = await supabase.from('produtos').select('*').order('nome')
  return error ? [] : data
}

async function criarProduto(produto) {
  const { data, error } = await supabase.from('produtos').insert(produto)
  if (error) throw new Error(error.message)
  return data
}

async function atualizarProduto(id, dados) {
  const { data, error } = await supabase.from('produtos').update(dados).eq('id', id)
  if (error) throw new Error(error.message)
  return data
}

async function deletarProduto(id) {
  await supabase.from('venda_itens').update({ produto_id: null }).eq('produto_id', id)
  const { data, error } = await supabase.from('produtos').delete().eq('id', id)
  if (error) throw new Error(error.message)
  return data
}

async function atualizarEstoque(id, novoEstoque) {
  const { data, error } = await supabase.from('produtos').update({ estoque: novoEstoque }).eq('id', id)
  if (error) throw new Error(error.message)
  return data
}

async function getVendas() {
  const { data, error } = await supabase
    .from('vendas')
    .select('*, venda_itens(*)')
    .order('criado_em', { ascending: false })
    .limit(50)
  return error ? [] : data
}

async function criarVenda(venda, itens) {
  const { data, error } = await supabase.from('vendas').insert(venda).select().single()
  if (error || !data) return { error }
  const itensComId = itens.map(item => ({ ...item, venda_id: data.id }))
  await supabase.from('venda_itens').insert(itensComId)
  return { data }
}

async function resetarDados() {
  await supabase.from('venda_itens').delete().neq('id', 0)
  await supabase.from('vendas').delete().neq('id', 0)
  await supabase.from('produtos').delete().neq('id', 0)
}

/* ═══════════════════════════════════════════════════════════════
   CONSTANTES
   ═══════════════════════════════════════════════════════════════ */

const NAV_ITEMS = [
  { id: 'produtos', label: 'Produtos', icon: Package },
  { id: 'vendas', label: 'Vendas', icon: ShoppingCart },
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
]

/* ═══════════════════════════════════════════════════════════════
   UTILS
   ═══════════════════════════════════════════════════════════════ */
function formatCurrency(value) {
  return `R$ ${Number(value).toFixed(2).replace('.', ',')}`
}

function parseCurrencyInput(raw) {
  const cleaned = raw.replace(/[^\d,]/g, '').replace(',', '.')
  return parseFloat(cleaned) || 0
}

function formatDateTime(iso) {
  const d = new Date(iso)
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/* ═══════════════════════════════════════════════════════════════
   COMPONENTE: Toast de sucesso
   ═══════════════════════════════════════════════════════════════ */
function Toast({ message, visible, onClose }) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onClose, 3000)
      return () => clearTimeout(timer)
    }
  }, [visible, onClose])

  if (!visible) return null

  return (
    <div className="fixed top-6 right-6 z-50 animate-toast-in">
      <div className="flex items-center gap-3 px-5 py-3.5 rounded-xl bg-dark-800 border border-mint/30 shadow-2xl shadow-mint/10">
        <CheckCircle2 className="w-5 h-5 text-mint flex-shrink-0" />
        <span className="text-sm font-medium text-gray-100">{message}</span>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   COMPONENTE: Modal de confirmação
   ═══════════════════════════════════════════════════════════════ */
function ConfirmModal({ open, title, message, onConfirm, onCancel, loading }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-dark-800 border border-dark-600 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl animate-fade-in-up">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-100">{title}</h3>
        </div>
        <p className="text-sm text-gray-400 mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400 bg-dark-700 hover:bg-dark-600 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors cursor-pointer disabled:opacity-50"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {loading ? 'Excluindo...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   COMPONENTE: Sidebar / Navegação lateral
   ═══════════════════════════════════════════════════════════════ */
function Sidebar({ active, onChange, onLogout }) {
  return (
    <aside className="w-20 lg:w-64 bg-dark-800 border-r border-dark-700 flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-dark-700">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-mint to-emerald-400 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-dark-900" />
          </div>
          <span className="hidden lg:block font-semibold text-base text-gray-100 tracking-tight">
            PDV<span className="text-mint">Flow</span>
          </span>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 px-2 lg:px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = active === item.id
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`
                w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer
                ${
                  isActive
                    ? 'bg-mint/10 text-mint'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-dark-700'
                }
              `}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-mint' : ''}`} />
              <span className="hidden lg:block">{item.label}</span>
              {isActive && (
                <ChevronRight className="hidden lg:block w-4 h-4 ml-auto text-mint/50" />
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-dark-700 space-y-2">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center lg:justify-start gap-2 px-3 py-2 rounded-lg text-xs font-medium text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden lg:block">Sair</span>
        </button>
        <div className="hidden lg:block text-xs text-gray-600 text-center">
          PDVFlow v1.0
        </div>
      </div>
    </aside>
  )
}

/* ═══════════════════════════════════════════════════════════════
   COMPONENTE: Badge de estoque
   ═══════════════════════════════════════════════════════════════ */
function StockBadge({ qty }) {
  if (qty === 0) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/20">
        Esgotado
      </span>
    )
  }
  if (qty <= 10) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-500/15 text-yellow-400 border border-yellow-500/20">
        {qty} un
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-mint border border-emerald-500/20">
      {qty} un
    </span>
  )
}

/* ═══════════════════════════════════════════════════════════════
   PÁGINA 1: CADASTRO DE PRODUTOS
   ═══════════════════════════════════════════════════════════════ */
function ProdutosPage({ produtos, carregarProdutos, onToast }) {
  const [nome, setNome] = useState('')
  const [preco, setPreco] = useState('')
  const [estoque, setEstoque] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [salvando, setSalvando] = useState(false)

  const isEditing = editingId !== null

  const resetForm = () => {
    setNome('')
    setPreco('')
    setEstoque('')
    setEditingId(null)
  }

  const handleSave = async () => {
    if (!nome.trim() || !preco || !estoque) return
    setSalvando(true)
    try {
      if (isEditing) {
        await atualizarProduto(editingId, {
          nome: nome.trim(),
          preco: parseFloat(preco),
          estoque: parseInt(estoque),
        })
        onToast('Produto atualizado com sucesso!')
      } else {
        await criarProduto({
          nome: nome.trim(),
          preco: parseFloat(preco),
          estoque: parseInt(estoque),
        })
        onToast('Produto cadastrado com sucesso!')
      }
      await carregarProdutos()
      resetForm()
    } catch {
      onToast('Erro ao salvar produto')
    } finally {
      setSalvando(false)
    }
  }

  const handleEdit = (produto) => {
    setNome(produto.nome)
    setPreco(String(produto.preco))
    setEstoque(String(produto.estoque))
    setEditingId(produto.id)
  }

  const handleDelete = async () => {
    setSalvando(true)
    try {
      await deletarProduto(deleteId)
      await carregarProdutos()
      onToast('Produto excluído com sucesso!')
    } catch {
      onToast('Erro ao excluir produto')
    } finally {
      setDeleteId(null)
      setSalvando(false)
    }
  }

  const canSave = nome.trim() && preco && estoque && parseFloat(preco) > 0 && parseInt(estoque) >= 0 && !salvando

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-100 tracking-tight">Produtos</h1>
        <p className="text-sm text-gray-500 mt-1">Cadastre e gerencie seus produtos</p>
      </div>

      {/* Formulário */}
      <div className="bg-dark-800 border border-dark-700 rounded-2xl p-6 mb-8">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-5">
          {isEditing ? 'Editar Produto' : 'Novo Produto'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Nome do produto</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Café Expresso"
              className="w-full px-4 py-3 rounded-xl bg-dark-700 border border-dark-600 text-sm text-gray-100 placeholder:text-gray-600 focus:outline-none focus:border-mint/50 focus:ring-1 focus:ring-mint/20 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Preço de venda</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">R$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
                placeholder="0,00"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-dark-700 border border-dark-600 text-sm text-gray-100 placeholder:text-gray-600 focus:outline-none focus:border-mint/50 focus:ring-1 focus:ring-mint/20 transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Estoque inicial</label>
            <input
              type="number"
              min="0"
              step="1"
              value={estoque}
              onChange={(e) => setEstoque(e.target.value)}
              placeholder="0"
              className="w-full px-4 py-3 rounded-xl bg-dark-700 border border-dark-600 text-sm text-gray-100 placeholder:text-gray-600 focus:outline-none focus:border-mint/50 focus:ring-1 focus:ring-mint/20 transition-colors"
            />
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={!canSave}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
              canSave
                ? 'bg-mint text-dark-900 hover:bg-mint-dark shadow-lg shadow-mint/20'
                : 'bg-dark-600 text-gray-500 cursor-not-allowed'
            }`}
          >
            {salvando ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isEditing ? (
              <Check className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {salvando ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Cadastrar Produto'}
          </button>
          {isEditing && (
            <button
              onClick={resetForm}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-gray-400 bg-dark-700 hover:bg-dark-600 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" /> Cancelar
            </button>
          )}
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-dark-800 border border-dark-700 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-dark-700">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Produtos Cadastrados ({produtos.length})
          </h2>
        </div>
        {produtos.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Nenhum produto cadastrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Preço
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Estoque
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {produtos.map((produto, i) => (
                  <tr
                    key={produto.id}
                    className="border-b border-dark-700/50 last:border-b-0 hover:bg-dark-700/30 transition-colors animate-fade-in"
                    style={{ animationDelay: `${i * 0.03}s` }}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-200">{produto.nome}</td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-300">
                      {formatCurrency(produto.preco)}
                    </td>
                    <td className="px-6 py-4">
                      <StockBadge qty={produto.estoque} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(produto)}
                          className="p-2 rounded-lg text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors cursor-pointer"
                          title="Editar"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(produto.id)}
                          className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de confirmação de exclusão */}
      <ConfirmModal
        open={deleteId !== null}
        title="Excluir produto"
        message="Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        loading={salvando}
      />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   PÁGINA 2: VENDAS (PDV / CARRINHO)
   ═══════════════════════════════════════════════════════════════ */
function VendasPage({ produtos, carregarProdutos, carregarVendas, onToast }) {
  const [carrinho, setCarrinho] = useState([])
  const [valorRecebido, setValorRecebido] = useState('')
  const [successAnim, setSuccessAnim] = useState(false)
  const [finalizando, setFinalizando] = useState(false)

  const disponiveis = produtos.filter((p) => p.estoque > 0)

  const total = useMemo(
    () => carrinho.reduce((sum, item) => sum + item.preco * item.quantidade, 0),
    [carrinho]
  )

  const valorNum = parseCurrencyInput(valorRecebido)
  const troco = valorNum - total
  const podeFinalizar = carrinho.length > 0 && valorNum >= total && total > 0

  const adicionarAoCarrinho = (produto) => {
    setCarrinho((prev) => {
      const existing = prev.find((c) => c.produtoId === produto.id)
      if (existing) {
        if (existing.quantidade >= produto.estoque) return prev
        return prev.map((c) =>
          c.produtoId === produto.id ? { ...c, quantidade: c.quantidade + 1 } : c
        )
      }
      return [
        ...prev,
        { produtoId: produto.id, nome: produto.nome, preco: produto.preco, quantidade: 1 },
      ]
    })
  }

  const alterarQuantidade = (produtoId, delta) => {
    setCarrinho((prev) =>
      prev
        .map((c) => {
          if (c.produtoId !== produtoId) return c
          const produto = produtos.find((p) => p.id === produtoId)
          const novaQtd = c.quantidade + delta
          if (novaQtd <= 0) return null
          if (novaQtd > produto.estoque) return c
          return { ...c, quantidade: novaQtd }
        })
        .filter(Boolean)
    )
  }

  const removerDoCarrinho = (produtoId) => {
    setCarrinho((prev) => prev.filter((c) => c.produtoId !== produtoId))
  }

  const finalizarVenda = async () => {
    if (!podeFinalizar || finalizando) return
    setFinalizando(true)

    try {
      const venda = {
        total,
        valor_recebido: valorNum,
        troco: troco,
      }
      const itens = carrinho.map(c => ({
        produto_id: c.produtoId,
        nome_produto: c.nome,
        preco_unitario: c.preco,
        quantidade: c.quantidade,
        subtotal: c.preco * c.quantidade,
      }))

      const { error } = await criarVenda(venda, itens)
      if (error) {
        onToast('Erro ao finalizar venda')
        setFinalizando(false)
        return
      }

      for (const item of carrinho) {
        const produto = produtos.find(p => p.id === item.produtoId)
        if (produto) {
          await atualizarEstoque(item.produtoId, produto.estoque - item.quantidade)
        }
      }

      await carregarProdutos()
      await carregarVendas()

      setCarrinho([])
      setValorRecebido('')
      setSuccessAnim(true)
      onToast('Venda realizada com sucesso!')
      setTimeout(() => setSuccessAnim(false), 600)
    } catch {
      onToast('Erro ao finalizar venda')
    } finally {
      setFinalizando(false)
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-100 tracking-tight">Vendas</h1>
        <p className="text-sm text-gray-500 mt-1">PDV — Ponto de Venda</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Produtos disponíveis */}
        <div className="xl:col-span-3">
          <div className="bg-dark-800 border border-dark-700 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-5">
              Produtos Disponíveis
            </h2>
            {disponiveis.length === 0 ? (
              <div className="py-12 text-center">
                <ShoppingBag className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-500">Nenhum produto com estoque disponível</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {disponiveis.map((produto) => {
                  const noCarrinho = carrinho.find((c) => c.produtoId === produto.id)
                  const atMax = noCarrinho && noCarrinho.quantidade >= produto.estoque
                  return (
                    <div
                      key={produto.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-dark-700/50 border border-dark-600/50 hover:border-dark-500 transition-colors group"
                    >
                      <div className="flex-1 min-w-0 mr-3">
                        <p className="text-sm font-medium text-gray-200 truncate">{produto.nome}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm font-mono font-semibold text-mint">
                            {formatCurrency(produto.preco)}
                          </span>
                          <span className="text-xs text-gray-500">{produto.estoque} un</span>
                        </div>
                      </div>
                      <button
                        onClick={() => adicionarAoCarrinho(produto)}
                        disabled={atMax}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          atMax
                            ? 'bg-dark-600 text-gray-500 cursor-not-allowed'
                            : 'bg-mint/10 text-mint hover:bg-mint/20 border border-mint/20'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Adicionar
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Carrinho e resumo */}
        <div className="xl:col-span-2 space-y-6">
          {/* Carrinho */}
          <div
            className={`bg-dark-800 border rounded-2xl p-6 transition-all duration-300 ${
              successAnim ? 'border-mint/50 shadow-lg shadow-mint/10' : 'border-dark-700'
            }`}
          >
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-5">
              Carrinho ({carrinho.length})
            </h2>
            {carrinho.length === 0 ? (
              <div className="py-8 text-center">
                <ShoppingCart className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-500">Carrinho vazio</p>
              </div>
            ) : (
              <div className="space-y-3 mb-6">
                {carrinho.map((item) => {
                  const produto = produtos.find((p) => p.id === item.produtoId)
                  return (
                    <div
                      key={item.produtoId}
                      className="flex items-center gap-3 p-3 rounded-xl bg-dark-700/50 border border-dark-600/50"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-200 truncate">{item.nome}</p>
                        <p className="text-xs font-mono text-gray-500 mt-0.5">
                          {formatCurrency(item.preco)} × {item.quantidade} ={' '}
                          <span className="text-mint font-semibold">
                            {formatCurrency(item.preco * item.quantidade)}
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => alterarQuantidade(item.produtoId, -1)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-dark-600 transition-colors cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-mono font-semibold text-gray-200">
                          {item.quantidade}
                        </span>
                        <button
                          onClick={() => alterarQuantidade(item.produtoId, 1)}
                          disabled={item.quantidade >= produto.estoque}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            item.quantidade >= produto.estoque
                              ? 'text-gray-600 cursor-not-allowed'
                              : 'text-gray-400 hover:text-white hover:bg-dark-600'
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => removerDoCarrinho(item.produtoId)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors ml-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Total */}
            {carrinho.length > 0 && (
              <div className="pt-4 border-t border-dark-600">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-gray-400">Total</span>
                  <span className="text-xl font-mono font-bold text-gray-100">
                    {formatCurrency(total)}
                  </span>
                </div>

                {/* Valor recebido */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-500 mb-2">
                    Valor Recebido
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                      R$
                    </span>
                    <input
                      type="text"
                      value={valorRecebido}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^\d,]/g, '')
                        setValorRecebido(raw)
                      }}
                      placeholder="0,00"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-dark-700 border border-dark-600 text-sm font-mono text-gray-100 placeholder:text-gray-600 focus:outline-none focus:border-mint/50 focus:ring-1 focus:ring-mint/20 transition-colors"
                    />
                  </div>
                </div>

                {/* Troco */}
                {valorNum > 0 && (
                  <div
                    className={`flex items-center justify-between p-3 rounded-xl mb-4 ${
                      troco >= 0
                        ? 'bg-mint/10 border border-mint/20'
                        : 'bg-red-500/10 border border-red-500/20'
                    }`}
                  >
                    <span
                      className={`text-sm font-medium ${troco >= 0 ? 'text-mint' : 'text-red-400'}`}
                    >
                      {troco >= 0 ? 'Troco' : 'Valor insuficiente'}
                    </span>
                    {troco >= 0 && (
                      <span className="text-lg font-mono font-bold text-mint">
                        {formatCurrency(troco)}
                      </span>
                    )}
                    {troco < 0 && (
                      <span className="text-sm font-mono font-semibold text-red-400">
                        {formatCurrency(Math.abs(troco))}
                      </span>
                    )}
                  </div>
                )}

                {/* Botão finalizar */}
                <button
                  onClick={finalizarVenda}
                  disabled={!podeFinalizar || finalizando}
                  className={`w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer ${
                    podeFinalizar && !finalizando
                      ? 'bg-mint text-dark-900 hover:bg-mint-dark shadow-lg shadow-mint/20'
                      : 'bg-dark-600 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {finalizando ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  {finalizando ? 'Finalizando...' : 'Finalizar Venda'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   FUNÇÃO: Gerar PDF das vendas do dia
   ═══════════════════════════════════════════════════════════════ */
function gerarPDFVendasDoDia(vendas) {
  const hoje = new Date()
  const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
  const fimHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59)

  const vendasDoDia = vendas.filter((v) => {
    const dataVenda = new Date(v.criado_em)
    return dataVenda >= inicioHoje && dataVenda <= fimHoje
  })

  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 15
  let y = 20

  // Cabeçalho
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('PDVFlow - Relatório de Vendas', pageWidth / 2, y, { align: 'center' })
  y += 10

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  const dataFormatada = hoje.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  doc.text(dataFormatada, pageWidth / 2, y, { align: 'center' })
  y += 12

  // Linha separadora
  doc.setDrawColor(200)
  doc.line(margin, y, pageWidth - margin, y)
  y += 10

  // Resumo
  const faturamentoTotal = vendasDoDia.reduce((sum, v) => sum + v.total, 0)
  const trocoTotal = vendasDoDia.reduce((sum, v) => sum + v.troco, 0)

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Resumo do Dia', margin, y)
  y += 8

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Quantidade de vendas: ${vendasDoDia.length}`, margin, y); y += 6
  doc.text(`Faturamento total: R$ ${faturamentoTotal.toFixed(2).replace('.', ',')}`, margin, y); y += 6
  doc.text(`Troco total devolvido: R$ ${trocoTotal.toFixed(2).replace('.', ',')}`, margin, y)
  y += 12

  if (vendasDoDia.length === 0) {
    doc.setFontSize(11)
    doc.setTextColor(120)
    doc.text('Nenhuma venda registrada hoje.', pageWidth / 2, y, { align: 'center' })
  } else {
    // Linha separadora
    doc.setDrawColor(200)
    doc.line(margin, y, pageWidth - margin, y)
    y += 10

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0)
    doc.text('Detalhamento das Vendas', margin, y)
    y += 10

    vendasDoDia.forEach((venda, index) => {
      // Verifica se precisa de nova página
      if (y > 260) {
        doc.addPage()
        y = 20
      }

      const horaVenda = new Date(venda.criado_em).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      })

      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text(`Venda #${index + 1} - ${horaVenda}`, margin, y)
      y += 6

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)

      ;(venda.venda_itens || []).forEach((item) => {
        const subtotal = item.preco_unitario * item.quantidade
        doc.text(
          `  ${item.nome_produto}  x${item.quantidade}  R$ ${item.preco_unitario.toFixed(2).replace('.', ',')}  =  R$ ${subtotal.toFixed(2).replace('.', ',')}`,
          margin,
          y
        )
        y += 5
      })

      doc.setFont('helvetica', 'bold')
      doc.text(`  Total: R$ ${venda.total.toFixed(2).replace('.', ',')}  |  Troco: R$ ${venda.troco.toFixed(2).replace('.', ',')}`, margin, y)
      y += 10
    })
  }

  // Rodapé
  const totalPages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(
      `Gerado por PDVFlow em ${hoje.toLocaleString('pt-BR')}  |  Página ${i}/${totalPages}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    )
  }

  const nomeArquivo = `vendas_${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}.pdf`
  doc.save(nomeArquivo)
}

/* ═══════════════════════════════════════════════════════════════
   PÁGINA 3: DASHBOARD
   ═══════════════════════════════════════════════════════════════ */
function DashboardPage({ produtos, vendas, onReset }) {
  const totalVendas = useMemo(() => vendas.reduce((sum, v) => sum + v.total, 0), [vendas])
  const numVendas = vendas.length
  const numProdutos = produtos.length
  const estoqueBaixo = produtos.filter((p) => p.estoque <= 10).length

  const ultimasVendas = vendas.slice(0, 10)
  const alertasEstoque = produtos.filter((p) => p.estoque <= 10)

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto animate-fade-in-up">
      <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Visão geral do fluxo de caixa</p>
        </div>
        <button
          onClick={() => gerarPDFVendasDoDia(vendas)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-mint/10 text-mint hover:bg-mint/20 border border-mint/20 transition-all cursor-pointer"
        >
          <FileDown className="w-4 h-4" />
          PDF do Dia
        </button>
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
          Resetar Sistema
        </button>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <CardResumo
          icon={<TrendingUp className="w-5 h-5" />}
          label="Total em Vendas"
          value={formatCurrency(totalVendas)}
          color="mint"
          delay={0}
        />
        <CardResumo
          icon={<ShoppingCart className="w-5 h-5" />}
          label="Número de Vendas"
          value={String(numVendas)}
          color="blue"
          delay={1}
        />
        <CardResumo
          icon={<Package className="w-5 h-5" />}
          label="Produtos Cadastrados"
          value={String(numProdutos)}
          color="purple"
          delay={2}
        />
        <CardResumo
          icon={<AlertTriangle className="w-5 h-5" />}
          label="Estoque Baixo"
          value={String(estoqueBaixo)}
          color={estoqueBaixo > 0 ? 'gold' : 'gray'}
          delay={3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Últimas vendas */}
        <div className="lg:col-span-2 bg-dark-800 border border-dark-700 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-dark-700">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              Últimas Vendas
            </h2>
          </div>
          {ultimasVendas.length === 0 ? (
            <div className="py-16 text-center">
              <BarChart3 className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Nenhuma venda registrada ainda.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-700">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Data/Hora
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Itens
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Troco
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ultimasVendas.map((venda, i) => (
                    <tr
                      key={venda.id}
                      className="border-b border-dark-700/50 last:border-b-0 hover:bg-dark-700/30 transition-colors animate-fade-in"
                      style={{ animationDelay: `${i * 0.03}s` }}
                    >
                      <td className="px-6 py-3.5 text-sm text-gray-400 font-mono">
                        {formatDateTime(venda.criado_em)}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-gray-300">
                        {(venda.venda_itens || [])
                          .map((item) => `${item.nome_produto} (${item.quantidade})`)
                          .join(', ')}
                      </td>
                      <td className="px-6 py-3.5 text-sm font-mono font-semibold text-mint text-right">
                        {formatCurrency(venda.total)}
                      </td>
                      <td className="px-6 py-3.5 text-sm font-mono text-gray-400 text-right">
                        {formatCurrency(venda.troco)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Alertas de estoque */}
        <div className="bg-dark-800 border border-dark-700 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-dark-700">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              Alertas de Estoque
            </h2>
          </div>
          {alertasEstoque.length === 0 ? (
            <div className="py-12 text-center">
              <CheckCircle2 className="w-10 h-10 text-mint mx-auto mb-3" />
              <p className="text-sm text-mint font-medium">Estoque saudável!</p>
              <p className="text-xs text-gray-500 mt-1">Nenhum produto com estoque baixo</p>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {alertasEstoque.map((produto) => (
                <div
                  key={produto.id}
                  className={`flex items-center justify-between p-3 rounded-xl border ${
                    produto.estoque === 0
                      ? 'bg-red-500/10 border-red-500/20'
                      : 'bg-yellow-500/10 border-yellow-500/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle
                      className={`w-4 h-4 flex-shrink-0 ${
                        produto.estoque === 0 ? 'text-red-400' : 'text-yellow-400'
                      }`}
                    />
                    <span className="text-sm font-medium text-gray-200 truncate">
                      {produto.nome}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-bold font-mono px-2 py-1 rounded-md ${
                      produto.estoque === 0
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}
                  >
                    {produto.estoque} un
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   COMPONENTE: Card de resumo (Dashboard)
   ═══════════════════════════════════════════════════════════════ */
const colorMap = {
  mint: {
    bg: 'bg-mint/10',
    border: 'border-mint/20',
    icon: 'text-mint',
    value: 'text-mint',
  },
  blue: {
    bg: 'bg-blue-soft/10',
    border: 'border-blue-soft/20',
    icon: 'text-blue-soft',
    value: 'text-blue-soft',
  },
  purple: {
    bg: 'bg-purple-soft/10',
    border: 'border-purple-soft/20',
    icon: 'text-purple-soft',
    value: 'text-purple-soft',
  },
  gold: {
    bg: 'bg-gold/10',
    border: 'border-gold/20',
    icon: 'text-gold',
    value: 'text-gold',
  },
  gray: {
    bg: 'bg-gray-500/10',
    border: 'border-gray-500/20',
    icon: 'text-gray-400',
    value: 'text-gray-300',
  },
}

function CardResumo({ icon, label, value, color, delay }) {
  const colors = colorMap[color] || colorMap.gray

  return (
    <div
      className={`bg-dark-800 border border-dark-700 rounded-2xl p-5 animate-count-up`}
      style={{ animationDelay: `${delay * 0.08}s` }}
    >
      <div
        className={`w-10 h-10 rounded-xl ${colors.bg} ${colors.border} border flex items-center justify-center mb-4`}
      >
        <span className={colors.icon}>{icon}</span>
      </div>
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-mono font-bold ${colors.value}`}>{value}</p>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   COMPONENTE: Tela de Login
   ═══════════════════════════════════════════════════════════════ */
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  const handleSubmit = async () => {
    if (!email || !senha) return
    setCarregando(true)
    setErro('')

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    })

    if (error) {
      setErro('Email ou senha incorretos')
      setCarregando(false)
    } else {
      onLogin()
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-dark-900">
      <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8 w-full max-w-sm mx-4 animate-fade-in-up">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-mint to-emerald-400 flex items-center justify-center mb-4">
            <CreditCard className="w-7 h-7 text-dark-900" />
          </div>
          <h1 className="text-xl font-bold text-gray-100">
            PDV<span className="text-mint">Flow</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">Faça login para acessar</p>
        </div>

        <div className="space-y-3 mb-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              autoFocus
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-dark-700 border border-dark-600 text-sm text-gray-100 placeholder:text-gray-600 focus:outline-none focus:border-mint/50 focus:ring-1 focus:ring-mint/20 transition-colors"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="Senha"
              className={`w-full pl-11 pr-4 py-3 rounded-xl bg-dark-700 border text-sm text-gray-100 placeholder:text-gray-600 focus:outline-none transition-colors ${
                erro
                  ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500/20'
                  : 'border-dark-600 focus:border-mint/50 focus:ring-1 focus:ring-mint/20'
              }`}
            />
          </div>
          {erro && (
            <p className="text-xs text-red-400 animate-fade-in">{erro}</p>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={!email || !senha || carregando}
          className={`w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer ${
            email && senha && !carregando
              ? 'bg-mint text-dark-900 hover:bg-mint-dark shadow-lg shadow-mint/20'
              : 'bg-dark-600 text-gray-500 cursor-not-allowed'
          }`}
        >
          {carregando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
          {carregando ? 'Entrando...' : 'Entrar'}
        </button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL: App
   ═══════════════════════════════════════════════════════════════ */
export default function App() {
  const [autenticado, setAutenticado] = useState(false)
  const [verificandoSessao, setVerificandoSessao] = useState(true)
  const [produtos, setProdutos] = useState([])
  const [vendas, setVendas] = useState([])
  const [pagina, setPagina] = useState('produtos')
  const [toast, setToast] = useState({ visible: false, message: '' })
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState(null)
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetando, setResetando] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setAutenticado(true)
      setVerificandoSessao(false)
    })
  }, [])

  const carregarProdutos = useCallback(async () => {
    const data = await getProdutos()
    setProdutos(data)
  }, [])

  const carregarVendas = useCallback(async () => {
    const data = await getVendas()
    setVendas(data)
  }, [])

  const carregarDados = useCallback(async () => {
    setLoading(true)
    setErro(null)
    try {
      await Promise.all([carregarProdutos(), carregarVendas()])
    } catch {
      setErro('Erro ao conectar com o banco de dados. Verifique sua conexão.')
    } finally {
      setLoading(false)
    }
  }, [carregarProdutos, carregarVendas])

  useEffect(() => {
    if (autenticado) carregarDados()
  }, [autenticado, carregarDados])

  useEffect(() => {
    if (!autenticado) return
    const channel = supabase
      .channel('mudancas')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'produtos' }, () => carregarProdutos())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vendas' }, () => carregarVendas())
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.warn('Realtime: erro na conexão — dados não serão atualizados em tempo real')
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [autenticado, carregarProdutos, carregarVendas])

  const showToast = useCallback((message) => {
    setToast({ visible: true, message })
  }, [])

  const hideToast = useCallback(() => {
    setToast({ visible: false, message: '' })
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setAutenticado(false)
  }

  const handleReset = async () => {
    setResetando(true)
    try {
      await resetarDados()
      await carregarDados()
      showToast('Todos os dados foram resetados!')
    } catch {
      showToast('Erro ao resetar dados')
    } finally {
      setResetando(false)
      setShowResetModal(false)
    }
  }

  if (verificandoSessao) {
    return (
      <div className="flex h-screen items-center justify-center bg-dark-900">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-mint animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-400">Verificando sessão...</p>
        </div>
      </div>
    )
  }

  if (!autenticado) {
    return <LoginScreen onLogin={() => setAutenticado(true)} />
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-dark-900">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-mint animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-400">Carregando dados...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-dark-900">
      {erro && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-500/10 border-b border-red-500/20 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-sm text-red-300">{erro}</span>
          </div>
          <button
            onClick={carregarDados}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Tentar novamente
          </button>
        </div>
      )}

      <Sidebar active={pagina} onChange={setPagina} onLogout={handleLogout} />
      <main className="flex-1 overflow-y-auto flex justify-center">
        {pagina === 'produtos' && (
          <ProdutosPage produtos={produtos} carregarProdutos={carregarProdutos} onToast={showToast} />
        )}
        {pagina === 'vendas' && (
          <VendasPage
            produtos={produtos}
            carregarProdutos={carregarProdutos}
            carregarVendas={carregarVendas}
            onToast={showToast}
          />
        )}
        {pagina === 'dashboard' && (
          <DashboardPage produtos={produtos} vendas={vendas} onReset={() => setShowResetModal(true)} />
        )}
      </main>

      <Toast message={toast.message} visible={toast.visible} onClose={hideToast} />

      <ConfirmModal
        open={showResetModal}
        title="Resetar sistema"
        message="Isso apagará TODOS os produtos e vendas permanentemente. Deseja continuar?"
        onConfirm={handleReset}
        onCancel={() => setShowResetModal(false)}
        loading={resetando}
      />
    </div>
  )
}
