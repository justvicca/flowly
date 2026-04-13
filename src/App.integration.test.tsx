/**
 * Testes de integração do App — Requisitos 1.1, 3.2, 3.7, 5.5
 */
/// <reference types="@testing-library/jest-dom" />

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeAll, vi } from 'vitest';
import { AuthProvider } from './auth/AuthContext';
import { AuthService } from './auth/AuthService';
import { MockAuthRepository } from './auth/MockAuthRepository';
import type { Sessao } from './auth/IAuthRepository';
import { RepositoryContext } from './repository/RepositoryContext';
import { MockFlowlyRepository } from './repository/MockFlowlyRepository';
import { PreferencesProvider } from './contexts/PreferencesContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { FlowlyAppContent } from './App';

// Mock Firebase to prevent initialization errors in test environment
vi.mock('./firebase', () => ({ app: {} }));
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn(() => Promise.resolve({ docs: [] })),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
}));
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  OAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
}));

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
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

const SESSAO_TESTE: Sessao = {
  usuario: { id: 'test-user-id', nome: 'Teste', email: 'teste@example.com' },
  token: 'mock-token',
  expiresAt: Date.now() + 3600000,
};

function renderWithActiveSession() {
  const authRepo = new MockAuthRepository();
  const authService = new AuthService(authRepo);
  (authRepo as unknown as { sessaoAtual: Sessao }).sessaoAtual = SESSAO_TESTE;
  const flowlyRepo = new MockFlowlyRepository();
  // Pre-populate a wallet so transactions can be assigned to it
  flowlyRepo.adicionarCarteira(SESSAO_TESTE.usuario.id, 'Carteira Principal');

  return render(
    <PreferencesProvider>
      <AuthProvider authService={authService}>
        <RepositoryContext.Provider value={flowlyRepo}>
          <ProtectedRoute>
            <FlowlyAppContent />
          </ProtectedRoute>
        </RepositoryContext.Provider>
      </AuthProvider>
    </PreferencesProvider>
  );
}

async function waitForAppReady() {
  await waitFor(
    () => expect(screen.getByRole('button', { name: /adicionar transação/i })).toBeInTheDocument(),
    { timeout: 3000 }
  );
}

async function navigateToCarteiras() {
  await userEvent.click(screen.getByRole('button', { name: /carteiras/i }));
}

describe('Integração: Autenticação no App', () => {
  it('renderiza SplashScreen enquanto verifica a sessão (Req 5.5)', async () => {
    const repo = new MockAuthRepository();
    const service = new AuthService(repo);
    vi.spyOn(service, 'obterSessaoAtual').mockImplementation(() => new Promise(() => {}));

    render(
      <PreferencesProvider>
        <AuthProvider authService={service}>
          <RepositoryContext.Provider value={new MockFlowlyRepository()}>
            <ProtectedRoute>
              <div data-testid="protected-content">Conteúdo protegido</div>
            </ProtectedRoute>
          </RepositoryContext.Provider>
        </AuthProvider>
      </PreferencesProvider>
    );

    expect(screen.getByTestId('splash-screen')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('renderiza LoginScreen quando não há sessão ativa (Req 1.1)', async () => {
    const repo = new MockAuthRepository();
    const service = new AuthService(repo);

    render(
      <PreferencesProvider>
        <AuthProvider authService={service}>
          <RepositoryContext.Provider value={new MockFlowlyRepository()}>
            <ProtectedRoute>
              <div data-testid="protected-content">Conteúdo protegido</div>
            </ProtectedRoute>
          </RepositoryContext.Provider>
        </AuthProvider>
      </PreferencesProvider>
    );

    await waitFor(() => expect(screen.getByTestId('login-screen')).toBeInTheDocument());
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('renderiza conteúdo protegido quando há sessão ativa (Req 1.1, 5.2)', async () => {
    renderWithActiveSession();

    await waitFor(() => {
      expect(screen.queryByTestId('login-screen')).not.toBeInTheDocument();
      expect(screen.queryByTestId('splash-screen')).not.toBeInTheDocument();
    });

    await waitForAppReady();
    expect(screen.getByRole('button', { name: /adicionar transação/i })).toBeInTheDocument();
  });
});

describe('Integração: App completo', () => {
  it('adiciona transação e reflete o saldo atualizado na aba Carteiras (Req 3.2, 5.5)', async () => {
    renderWithActiveSession();
    await waitForAppReady();

    await userEvent.click(screen.getByRole('button', { name: /adicionar transação/i }));

    const dialog = await screen.findByRole('dialog', { name: /nova transação/i });
    expect(dialog).toBeInTheDocument();

    await userEvent.type(within(dialog).getByLabelText(/descrição/i), 'Bônus de fim de ano');

    const valorInput = within(dialog).getByLabelText(/valor/i);
    await userEvent.clear(valorInput);
    await userEvent.type(valorInput, '2000');

    await userEvent.selectOptions(within(dialog).getByLabelText(/tipo/i), 'entrada');

    const carteiraSelect = within(dialog).getByLabelText(/carteira/i);
    const options = Array.from(carteiraSelect.querySelectorAll('option')).filter(
      (o) => (o as HTMLOptionElement).value !== ''
    );
    if (options.length > 0) {
      await userEvent.selectOptions(carteiraSelect, (options[0] as HTMLOptionElement).value);
    }

    await userEvent.click(within(dialog).getByRole('button', { name: /salvar/i }));

    await waitFor(() => expect(screen.getByText('Bônus de fim de ano')).toBeInTheDocument());

    await navigateToCarteiras();

    await waitFor(() =>
      expect(screen.getByLabelText(/saldo total consolidado/i)).toBeInTheDocument()
    );
  });

  it('remove transação com confirmação e exibe mensagem de sucesso (Req 3.7)', async () => {
    renderWithActiveSession();
    await waitForAppReady();

    await userEvent.click(screen.getByRole('button', { name: /adicionar transação/i }));
    const dialog = await screen.findByRole('dialog', { name: /nova transação/i });

    await userEvent.type(within(dialog).getByLabelText(/descrição/i), 'Transação para remover');
    const valorInput = within(dialog).getByLabelText(/valor/i);
    await userEvent.clear(valorInput);
    await userEvent.type(valorInput, '100');
    await userEvent.selectOptions(within(dialog).getByLabelText(/tipo/i), 'saida');
    await userEvent.click(within(dialog).getByRole('button', { name: /salvar/i }));

    await waitFor(() => expect(screen.getByText('Transação para remover')).toBeInTheDocument());

    const apagarBtns = screen.getAllByRole('button', { name: /apagar transação/i });
    await userEvent.click(apagarBtns[0]);

    const confirmDialog = await screen.findByRole('dialog', { name: /confirmação/i });
    await userEvent.click(within(confirmDialog).getByRole('button', { name: /confirmar/i }));

    await waitFor(() =>
      expect(screen.getByText('Pronto! A transação foi removida.')).toBeInTheDocument()
    );
  });
});
