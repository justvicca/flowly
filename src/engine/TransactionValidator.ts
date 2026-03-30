import type { TransactionInput, ValidationResult } from '../types/flowly';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(data: string): boolean {
  if (!DATE_REGEX.test(data)) return false;
  const d = new Date(data);
  return !isNaN(d.getTime());
}

export function validarTransacao(input: TransactionInput): ValidationResult {
  if (!input.descricao || input.descricao.trim() === '') {
    return { valido: false, erro: 'A descrição não pode ser vazia.' };
  }

  if (typeof input.valor !== 'number' || input.valor <= 0) {
    return { valido: false, erro: 'O valor deve ser um número maior que zero.' };
  }

  if (input.tipo !== 'entrada' && input.tipo !== 'saida') {
    return { valido: false, erro: 'O tipo deve ser "entrada" ou "saida".' };
  }

  if (!isValidDate(input.data)) {
    return { valido: false, erro: 'A data deve estar no formato YYYY-MM-DD.' };
  }

  if (!input.carteira_origem || input.carteira_origem.trim() === '') {
    return { valido: false, erro: 'A carteira de origem não pode ser vazia.' };
  }

  if (typeof input.fixo !== 'boolean') {
    return { valido: false, erro: 'O campo fixo deve ser um booleano.' };
  }

  return { valido: true };
}
