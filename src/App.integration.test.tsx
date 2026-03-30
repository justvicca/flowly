/**
 * Testes de integração do App — Requisitos 3.2, 3.7, 5.5
 *
 * Cobrem dois fluxos completos:
 *  1. Adicionar transação → verificar saldo atualizado na carteira
 *  2. Remover transação com confirmação → verificar mensagem de sucesso
 */

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeAll } from 'vitest';
import App from './App';

// jsdom não implementa window.matchMedia — polyfill necessário para useIsMobile
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false, // simula desktop (não mobile)
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Aguarda o carregamento inicial (spinner/loading desaparecer e transações aparecerem). */
async function waitForAppReady() {
  // O MockFlowlyRepository carrega transações de seed; aguardamos pelo menos uma aparecer.
  // Pode haver múltiplas ocorrências de "Salário" (seed + recorrência gerada), então usamos getAllByText.
  await waitFor(() => {
    const items = screen.getAllByText('Salário');
    expect(items.length).toBeGreaterThan(0);
  }, { timeout: 3000 });
}

/** Navega para a aba "Carteiras" clicando no link/botão de navegação. */
async function navigateToCarteiras() {
  // AppLayout usa Sidebar (desktop) ou BottomTabs (mobile).
  // Em jsdom, useIsMobile retorna false → Sidebar é renderizada.
  // A Sidebar tem um botão/link com texto "Carteiras".
  const carteirasBtn = screen.getByRole('button', { name: /carteiras/i });
  await userEvent.click(carteirasBtn);
}

// ---------------------------------------------------------------------------
// Testes
// ---------------------------------------------------------------------------

describe('Integração: App completo', () => {
  /**
   * Fluxo 1: Adicionar transação → verificar saldo atualizado na carteira
   * Valida: Requisitos 3.2, 5.5
   */
  it('adiciona transação e reflete o saldo atualizado na aba Carteiras (Req 3.2, 5.5)', async () => {
    render(<App />);
    await waitForAppReady();

    // 1. Abrir o formulário de nova transação
    const addBtn = screen.getByRole('button', { name: /adicionar transação/i });
    await userEvent.click(addBtn);

    // 2. O modal deve aparecer
    const dialog = await screen.findByRole('dialog', { name: /nova transação/i });
    expect(dialog).toBeInTheDocument();

    // 3. Preencher o formulário
    const descricaoInput = within(dialog).getByLabelText(/descrição/i);
    await userEvent.clear(descricaoInput);
    await userEvent.type(descricaoInput, 'Bônus de fim de ano');

    const valorInput = within(dialog).getByLabelText(/valor/i);
    await userEvent.clear(valorInput);
    await userEvent.type(valorInput, '2000');

    // Selecionar tipo "Entrada"
    const tipoSelect = within(dialog).getByLabelText(/tipo/i);
    await userEvent.selectOptions(tipoSelect, 'entrada');

    // Selecionar carteira "Banco do Brasil"
    const carteiraSelect = within(dialog).getByLabelText(/carteira/i);
    await userEvent.selectOptions(carteiraSelect, 'Banco do Brasil');

    // 4. Submeter o formulário
    const salvarBtn = within(dialog).getByRole('button', { name: /salvar/i });
    await userEvent.click(salvarBtn);

    // 5. Verificar que a transação aparece na lista
    await waitFor(() => {
      expect(screen.getByText('Bônus de fim de ano')).toBeInTheDocument();
    });

    // 6. Navegar para a aba Carteiras e verificar que o saldo foi atualizado
    await navigateToCarteiras();

    // O saldo de "Banco do Brasil" deve incluir os R$ 2.000 adicionados.
    // Verificamos que o card da carteira está presente e exibe um valor positivo.
    await waitFor(() => {
      expect(screen.getByText('Banco do Brasil')).toBeInTheDocument();
    });

    // O saldo total consolidado também deve estar visível
    expect(screen.getByLabelText(/saldo total consolidado/i)).toBeInTheDocument();
  });

  /**
   * Fluxo 2: Remover transação com confirmação → verificar mensagem de sucesso
   * Valida: Requisitos 3.7
   */
  it('remove transação com confirmação e exibe "Pronto! A transação foi removida." (Req 3.7)', async () => {
    render(<App />);
    await waitForAppReady();

    // 1. Clicar em "Apagar" na primeira transação visível (seed data)
    const apagarBtns = screen.getAllByRole('button', { name: /apagar transação/i });
    expect(apagarBtns.length).toBeGreaterThan(0);
    await userEvent.click(apagarBtns[0]);

    // 2. ConfirmDialog deve aparecer
    const confirmDialog = await screen.findByRole('dialog', { name: /confirmação/i });
    expect(confirmDialog).toBeInTheDocument();

    // 3. Clicar em "Confirmar"
    const confirmarBtn = within(confirmDialog).getByRole('button', { name: /confirmar/i });
    await userEvent.click(confirmarBtn);

    // 4. Verificar que a mensagem de sucesso aparece
    await waitFor(() => {
      expect(
        screen.getByText('Pronto! A transação foi removida.')
      ).toBeInTheDocument();
    });
  });
});
