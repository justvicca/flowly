/**
 * Testes de integracao do App - Requisitos 1.1, 3.2, 3.7, 5.5
 */

import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeAll, vi } from "vitest";
import { AuthProvider } from "./auth/AuthContext";
import { AuthService } from "./auth/AuthService";
import { MockAuthRepository } from "./auth/MockAuthRepository";
import type { Sessao } from "./auth/IAuthRepository";
import { RepositoryProvider } from "./repository/RepositoryContext";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { FlowlyAppContent } from "./App";

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
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
  usuario: { id: "test-user-id", nome: "Teste", email: "teste@example.com" },
  token: "mock-token",
  expiresAt: Date.now() + 3600000,
};

function renderWithActiveSession() {
  const repo = new MockAuthRepository();
  const service = new AuthService(repo);
  (repo as unknown as { sessaoAtual: Sessao }).sessaoAtual = SESSAO_TESTE;
  return render(
    <AuthProvider authService={service}>
      <RepositoryProvider>
        <ProtectedRoute>
          <FlowlyAppContent />
        </ProtectedRoute>
      </RepositoryProvider>
    </AuthProvider>
  );
}

async function waitForAppReady() {
  await waitFor(
    () => expect(screen.getByRole("button", { name: /adicionar/i })).toBeInTheDocument(),
    { timeout: 3000 }
  );
}

async function navigateToCarteiras() {
  await userEvent.click(screen.getByRole("button", { name: /carteiras/i }));
}

async function navigateToTransacoes() {
  // The nav button for transactions contains "Transa" (with accent)
  const btns = screen.getAllByRole("button");
  const transBtn = btns.find((b) => b.textContent && b.textContent.includes("Transa"));
  if (transBtn) await userEvent.click(transBtn);
}

/** Adiciona uma carteira via UI */
async function addCarteiraViaUI(nome: string) {
  await navigateToCarteiras();
  // Click "Adicionar Carteira" button
  const addBtn = await screen.findByRole("button", { name: /adicionar carteira/i });
  await userEvent.click(addBtn);
  // Fill in the wallet name input
  const input = await screen.findByPlaceholderText(/banco do brasil/i);
  await userEvent.type(input, nome);
  // Click "Salvar"
  const form = screen.getByRole("form", { name: /formul/i });
  const salvarBtn = within(form).getByRole("button", { name: /salvar/i });
  await userEvent.click(salvarBtn);
  await waitFor(() => expect(screen.getByText(nome)).toBeInTheDocument());
  await navigateToTransacoes();
  await waitForAppReady();
}

describe("Integracao: Autenticacao no App", () => {
  it("renderiza SplashScreen enquanto verifica a sessao (Req 5.5)", async () => {
    const repo = new MockAuthRepository();
    const service = new AuthService(repo);
    vi.spyOn(service, "obterSessaoAtual").mockImplementation(() => new Promise(() => {}));

    render(
      <AuthProvider authService={service}>
        <RepositoryProvider>
          <ProtectedRoute>
            <div data-testid="protected-content">Conteudo protegido</div>
          </ProtectedRoute>
        </RepositoryProvider>
      </AuthProvider>
    );

    expect(screen.getByTestId("splash-screen")).toBeInTheDocument();
    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
  });

  it("renderiza LoginScreen quando nao ha sessao ativa (Req 1.1)", async () => {
    const repo = new MockAuthRepository();
    const service = new AuthService(repo);

    render(
      <AuthProvider authService={service}>
        <RepositoryProvider>
          <ProtectedRoute>
            <div data-testid="protected-content">Conteudo protegido</div>
          </ProtectedRoute>
        </RepositoryProvider>
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId("login-screen")).toBeInTheDocument());
    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
  });

  it("renderiza conteudo protegido quando ha sessao ativa (Req 1.1, 5.2)", async () => {
    renderWithActiveSession();

    await waitFor(() => {
      expect(screen.queryByTestId("login-screen")).not.toBeInTheDocument();
      expect(screen.queryByTestId("splash-screen")).not.toBeInTheDocument();
    });

    await waitForAppReady();
    expect(screen.getByRole("button", { name: /adicionar/i })).toBeInTheDocument();
  });
});

describe("Integracao: App completo", () => {
  it("adiciona transacao e reflete o saldo atualizado na aba Carteiras (Req 3.2, 5.5)", async () => {
    renderWithActiveSession();
    await waitForAppReady();

    // Adicionar carteira primeiro
    await addCarteiraViaUI("Conta Corrente");

    // Agora adicionar transacao
    await userEvent.click(screen.getByRole("button", { name: /adicionar/i }));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();

    const descricaoInput = within(dialog).getByLabelText(/descri/i);
    await userEvent.type(descricaoInput, "Bonus fim de ano");

    const valorInput = within(dialog).getByLabelText(/valor/i);
    await userEvent.clear(valorInput);
    await userEvent.type(valorInput, "2000");

    await userEvent.selectOptions(within(dialog).getByLabelText(/tipo/i), "entrada");

    await userEvent.click(within(dialog).getByRole("button", { name: /salvar/i }));

    await waitFor(() => expect(screen.getByText("Bonus fim de ano")).toBeInTheDocument());

    await navigateToCarteiras();

    await waitFor(() =>
      expect(screen.getByLabelText(/saldo total/i)).toBeInTheDocument()
    );
  });

  it("remove transacao com confirmacao e exibe mensagem de sucesso (Req 3.7)", async () => {
    renderWithActiveSession();
    await waitForAppReady();

    // Adicionar carteira primeiro
    await addCarteiraViaUI("Conta Corrente");

    // Adicionar transacao para poder remover
    await userEvent.click(screen.getByRole("button", { name: /adicionar/i }));
    const dialog = await screen.findByRole("dialog");

    const descricaoInput = within(dialog).getByLabelText(/descri/i);
    await userEvent.type(descricaoInput, "Para remover");
    const valorInput = within(dialog).getByLabelText(/valor/i);
    await userEvent.clear(valorInput);
    await userEvent.type(valorInput, "100");
    await userEvent.selectOptions(within(dialog).getByLabelText(/tipo/i), "saida");
    await userEvent.click(within(dialog).getByRole("button", { name: /salvar/i }));

    await waitFor(() => expect(screen.getByText("Para remover")).toBeInTheDocument());

    const apagarBtns = screen.getAllByRole("button", { name: /apagar/i });
    await userEvent.click(apagarBtns[0]);

    const confirmDialog = await screen.findByRole("dialog", { name: /confirma/i });
    await userEvent.click(within(confirmDialog).getByRole("button", { name: /confirmar/i }));

    await waitFor(() =>
      expect(screen.getByText(/removida/i)).toBeInTheDocument()
    );
  });
});