import type { Transaction } from '../types/flowly';

/**
 * Gera cópias das transações fixas para o mês informado.
 * @param transacoesFixas - Array de transações com fixo: true
 * @param mes - Mês alvo no formato "YYYY-MM"
 * @returns Array de novas ocorrências geradas para o mês
 */
export function gerarOcorrenciasDoMes(
  transacoesFixas: Transaction[],
  mes: string
): Transaction[] {
  const [anoStr, mesStr] = mes.split('-');
  const ano = parseInt(anoStr, 10);
  const mesNum = parseInt(mesStr, 10); // 1-based

  return transacoesFixas
    .filter((t) => t.fixo)
    .map((t) => {
      const diaOriginal = parseInt(t.data.split('-')[2], 10);

      // Último dia do mês alvo
      const ultimoDia = new Date(ano, mesNum, 0).getDate();
      const dia = Math.min(diaOriginal, ultimoDia);

      const novaData = `${anoStr}-${mesStr.padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

      return {
        ...t,
        id: crypto.randomUUID(),
        data: novaData,
        recorrencia_id: t.recorrencia_id ?? t.id,
        timestamp: Date.now(),
      };
    });
}

/**
 * Atualiza o valor de uma transação fixa.
 * @param base - Transação base a ser atualizada
 * @param novoValor - Novo valor a aplicar
 * @param apenasAtual - Se true, retorna apenas a ocorrência atual atualizada;
 *                      se false, retorna a transação base atualizada (caller regenera futuras)
 * @returns Array com a(s) transação(ões) atualizada(s)
 */
export function atualizarRecorrencia(
  base: Transaction,
  novoValor: number,
  apenasAtual: boolean
): Transaction[] {
  if (apenasAtual) {
    return [{ ...base, valor: novoValor }];
  }

  // Atualiza o modelo base; o caller é responsável por regenerar ocorrências futuras
  return [{ ...base, valor: novoValor }];
}
