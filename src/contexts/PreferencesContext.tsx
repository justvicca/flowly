import { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────

export type Tema = 'claro' | 'escuro' | 'creme';
export type Idioma = 'pt' | 'en' | 'de' | 'es' | 'fr' | 'it';

export type Moeda = {
  codigo: string;
  simbolo: string;
  nome: string;
};

export const MOEDAS: Moeda[] = [
  { codigo: 'BRL', simbolo: 'R$', nome: 'Real Brasileiro' },
  { codigo: 'USD', simbolo: '$',  nome: 'Dólar Americano' },
  { codigo: 'EUR', simbolo: '€',  nome: 'Euro' },
  { codigo: 'GBP', simbolo: '£',  nome: 'Libra Esterlina' },
  { codigo: 'CHF', simbolo: 'Fr', nome: 'Franco Suíço' },
  { codigo: 'JPY', simbolo: '¥',  nome: 'Iene Japonês' },
  { codigo: 'CAD', simbolo: 'C$', nome: 'Dólar Canadense' },
  { codigo: 'AUD', simbolo: 'A$', nome: 'Dólar Australiano' },
  { codigo: 'ARS', simbolo: '$',  nome: 'Peso Argentino' },
  { codigo: 'CLP', simbolo: '$',  nome: 'Peso Chileno' },
  { codigo: 'MXN', simbolo: '$',  nome: 'Peso Mexicano' },
  { codigo: 'COP', simbolo: '$',  nome: 'Peso Colombiano' },
  { codigo: 'PEN', simbolo: 'S/', nome: 'Sol Peruano' },
  { codigo: 'CNY', simbolo: '¥',  nome: 'Yuan Chinês' },
  { codigo: 'INR', simbolo: '₹',  nome: 'Rúpia Indiana' },
];

export const IDIOMAS: { codigo: Idioma; nome: string; nomeNativo: string }[] = [
  { codigo: 'pt', nome: 'Português', nomeNativo: 'Português' },
  { codigo: 'en', nome: 'Inglês', nomeNativo: 'English' },
  { codigo: 'de', nome: 'Alemão', nomeNativo: 'Deutsch' },
  { codigo: 'es', nome: 'Espanhol', nomeNativo: 'Español' },
  { codigo: 'fr', nome: 'Francês', nomeNativo: 'Français' },
  { codigo: 'it', nome: 'Italiano', nomeNativo: 'Italiano' },
];

// ── Translations ───────────────────────────────────────────────────────────

export type TranslationKey =
  | 'transacoes' | 'carteiras' | 'bancos' | 'configuracoes'
  | 'adicionarTransacao' | 'pesquisar' | 'todos' | 'ganhos' | 'gastos' | 'fixos' | 'naoFixos'
  | 'saldoTotal' | 'adicionarCarteira' | 'conectarBanco' | 'conta' | 'seguranca'
  | 'aparencia' | 'tema' | 'moeda' | 'idioma' | 'sessao' | 'sairDaConta'
  | 'zonaDaPerigo' | 'excluirConta' | 'alterarSenha' | 'alterarNome'
  | 'entrar' | 'criarConta' | 'esqueciSenha' | 'bemVindo' | 'ouContinueCom'
  | 'naoTemConta' | 'jaTemConta' | 'email' | 'senha' | 'nomeCompleto'
  | 'conectarBancoDesc' | 'importacaoConcluida' | 'algoDeuErrado' | 'tentarNovamente'
  | 'conectarOutroBanco' | 'entrada' | 'saida' | 'copiar' | 'duplicar' | 'mover' | 'apagar'
  | 'nome' | 'escolherTema' | 'escolherMoeda' | 'escolherIdioma' | 'salvar'
  | 'excluirMinhaConta' | 'excluirContaDesc' | 'excluirContaConfirmacao'
  | 'novaTransacao' | 'copiarTransacao' | 'transacaoSalva';

type Translations = Record<TranslationKey, string>;

const t: Record<Idioma, Translations> = {
  pt: {
    transacoes: 'Transações', carteiras: 'Carteiras', bancos: 'Bancos', configuracoes: 'Configurações',
    adicionarTransacao: 'Adicionar Transação', pesquisar: 'Pesquisar transações...', todos: 'Todos',
    ganhos: 'Ganhos', gastos: 'Gastos', fixos: 'Fixos', naoFixos: 'Não fixos',
    saldoTotal: 'Saldo Total', adicionarCarteira: 'Adicionar Carteira', conectarBanco: 'Conectar banco',
    conta: 'Conta', seguranca: 'Segurança', aparencia: 'Aparência', tema: 'Tema', moeda: 'Moeda',
    idioma: 'Idioma', sessao: 'Sessão', sairDaConta: 'Sair da conta', zonaDaPerigo: 'Zona de perigo',
    excluirConta: 'Excluir conta', alterarSenha: 'Alterar senha', alterarNome: 'Alterar nome',
    entrar: 'Entrar', criarConta: 'Criar conta', esqueciSenha: 'Esqueci minha senha',
    bemVindo: 'Bem-vindo ao Flowly', ouContinueCom: 'Ou continue com',
    naoTemConta: 'Não tem conta?', jaTemConta: 'Já tem conta?',
    email: 'Email', senha: 'Senha', nomeCompleto: 'Nome completo',
    conectarBancoDesc: 'Importe automaticamente suas transações dos últimos 2 meses.',
    importacaoConcluida: 'Importação concluída!', algoDeuErrado: 'Algo deu errado',
    tentarNovamente: 'Tentar novamente', conectarOutroBanco: 'Conectar outro banco',
    entrada: 'Entrada', saida: 'Saída', copiar: 'Copiar', duplicar: 'Duplicar', mover: 'Mover', apagar: 'Apagar',
    nome: 'Nome', escolherTema: 'Escolher tema', escolherMoeda: 'Escolher moeda', escolherIdioma: 'Escolher idioma',
    salvar: 'Salvar', excluirMinhaConta: 'Excluir minha conta',
    excluirContaDesc: 'Remove todos os seus dados permanentemente',
    excluirContaConfirmacao: 'Esta ação é irreversível. Todos os seus dados serão apagados permanentemente. Digite sua senha para confirmar.',
    novaTransacao: 'Nova Transação', copiarTransacao: 'Copiar Transação', transacaoSalva: 'Pronto! A transação foi salva.',
  },
  en: {
    transacoes: 'Transactions', carteiras: 'Wallets', bancos: 'Banks', configuracoes: 'Settings',
    adicionarTransacao: 'Add Transaction', pesquisar: 'Search transactions...', todos: 'All',
    ganhos: 'Income', gastos: 'Expenses', fixos: 'Fixed', naoFixos: 'Non-fixed',
    saldoTotal: 'Total Balance', adicionarCarteira: 'Add Wallet', conectarBanco: 'Connect bank',
    conta: 'Account', seguranca: 'Security', aparencia: 'Appearance', tema: 'Theme', moeda: 'Currency',
    idioma: 'Language', sessao: 'Session', sairDaConta: 'Sign out', zonaDaPerigo: 'Danger zone',
    excluirConta: 'Delete account', alterarSenha: 'Change password', alterarNome: 'Change name',
    entrar: 'Sign in', criarConta: 'Create account', esqueciSenha: 'Forgot password',
    bemVindo: 'Welcome to Flowly', ouContinueCom: 'Or continue with',
    naoTemConta: "Don't have an account?", jaTemConta: 'Already have an account?',
    email: 'Email', senha: 'Password', nomeCompleto: 'Full name',
    conectarBancoDesc: 'Automatically import your transactions from the last 2 months.',
    importacaoConcluida: 'Import complete!', algoDeuErrado: 'Something went wrong',
    tentarNovamente: 'Try again', conectarOutroBanco: 'Connect another bank',
    entrada: 'Income', saida: 'Expense', copiar: 'Copy', duplicar: 'Duplicate', mover: 'Move', apagar: 'Delete',
    nome: 'Name', escolherTema: 'Choose theme', escolherMoeda: 'Choose currency', escolherIdioma: 'Choose language',
    salvar: 'Save', excluirMinhaConta: 'Delete my account',
    excluirContaDesc: 'Permanently removes all your data',
    excluirContaConfirmacao: 'This action is irreversible. All your data will be permanently deleted. Enter your password to confirm.',
    novaTransacao: 'New Transaction', copiarTransacao: 'Copy Transaction', transacaoSalva: 'Done! Transaction saved.',
  },
  de: {
    transacoes: 'Transaktionen', carteiras: 'Konten', bancos: 'Banken', configuracoes: 'Einstellungen',
    adicionarTransacao: 'Transaktion hinzufügen', pesquisar: 'Transaktionen suchen...', todos: 'Alle',
    ganhos: 'Einnahmen', gastos: 'Ausgaben', fixos: 'Fest', naoFixos: 'Variabel',
    saldoTotal: 'Gesamtguthaben', adicionarCarteira: 'Konto hinzufügen', conectarBanco: 'Bank verbinden',
    conta: 'Konto', seguranca: 'Sicherheit', aparencia: 'Erscheinungsbild', tema: 'Design', moeda: 'Währung',
    idioma: 'Sprache', sessao: 'Sitzung', sairDaConta: 'Abmelden', zonaDaPerigo: 'Gefahrenzone',
    excluirConta: 'Konto löschen', alterarSenha: 'Passwort ändern', alterarNome: 'Name ändern',
    entrar: 'Anmelden', criarConta: 'Konto erstellen', esqueciSenha: 'Passwort vergessen',
    bemVindo: 'Willkommen bei Flowly', ouContinueCom: 'Oder weiter mit',
    naoTemConta: 'Kein Konto?', jaTemConta: 'Bereits ein Konto?',
    email: 'E-Mail', senha: 'Passwort', nomeCompleto: 'Vollständiger Name',
    conectarBancoDesc: 'Importiere automatisch deine Transaktionen der letzten 2 Monate.',
    importacaoConcluida: 'Import abgeschlossen!', algoDeuErrado: 'Etwas ist schiefgelaufen',
    tentarNovamente: 'Erneut versuchen', conectarOutroBanco: 'Weitere Bank verbinden',
    entrada: 'Einnahme', saida: 'Ausgabe', copiar: 'Kopieren', duplicar: 'Duplizieren', mover: 'Verschieben', apagar: 'Löschen',
    nome: 'Name', escolherTema: 'Design wählen', escolherMoeda: 'Währung wählen', escolherIdioma: 'Sprache wählen',
    salvar: 'Speichern', excluirMinhaConta: 'Mein Konto löschen',
    excluirContaDesc: 'Löscht alle Ihre Daten dauerhaft',
    excluirContaConfirmacao: 'Diese Aktion ist unwiderruflich. Alle Ihre Daten werden dauerhaft gelöscht. Geben Sie Ihr Passwort zur Bestätigung ein.',
    novaTransacao: 'Neue Transaktion', copiarTransacao: 'Transaktion kopieren', transacaoSalva: 'Fertig! Transaktion gespeichert.',
  },
  es: {
    transacoes: 'Transacciones', carteiras: 'Carteras', bancos: 'Bancos', configuracoes: 'Configuración',
    adicionarTransacao: 'Agregar transacción', pesquisar: 'Buscar transacciones...', todos: 'Todos',
    ganhos: 'Ingresos', gastos: 'Gastos', fixos: 'Fijos', naoFixos: 'Variables',
    saldoTotal: 'Saldo total', adicionarCarteira: 'Agregar cartera', conectarBanco: 'Conectar banco',
    conta: 'Cuenta', seguranca: 'Seguridad', aparencia: 'Apariencia', tema: 'Tema', moeda: 'Moneda',
    idioma: 'Idioma', sessao: 'Sesión', sairDaConta: 'Cerrar sesión', zonaDaPerigo: 'Zona de peligro',
    excluirConta: 'Eliminar cuenta', alterarSenha: 'Cambiar contraseña', alterarNome: 'Cambiar nombre',
    entrar: 'Iniciar sesión', criarConta: 'Crear cuenta', esqueciSenha: 'Olvidé mi contraseña',
    bemVindo: 'Bienvenido a Flowly', ouContinueCom: 'O continuar con',
    naoTemConta: '¿No tienes cuenta?', jaTemConta: '¿Ya tienes cuenta?',
    email: 'Correo', senha: 'Contraseña', nomeCompleto: 'Nombre completo',
    conectarBancoDesc: 'Importa automáticamente tus transacciones de los últimos 2 meses.',
    importacaoConcluida: '¡Importación completada!', algoDeuErrado: 'Algo salió mal',
    tentarNovamente: 'Intentar de nuevo', conectarOutroBanco: 'Conectar otro banco',
    entrada: 'Ingreso', saida: 'Gasto', copiar: 'Copiar', duplicar: 'Duplicar', mover: 'Mover', apagar: 'Eliminar',
    nome: 'Nombre', escolherTema: 'Elegir tema', escolherMoeda: 'Elegir moneda', escolherIdioma: 'Elegir idioma',
    salvar: 'Guardar', excluirMinhaConta: 'Eliminar mi cuenta',
    excluirContaDesc: 'Elimina todos tus datos permanentemente',
    excluirContaConfirmacao: 'Esta acción es irreversible. Todos tus datos serán eliminados permanentemente. Ingresa tu contraseña para confirmar.',
    novaTransacao: 'Nueva Transacción', copiarTransacao: 'Copiar Transacción', transacaoSalva: '¡Listo! Transacción guardada.',
  },
  fr: {
    transacoes: 'Transactions', carteiras: 'Portefeuilles', bancos: 'Banques', configuracoes: 'Paramètres',
    adicionarTransacao: 'Ajouter une transaction', pesquisar: 'Rechercher...', todos: 'Tous',
    ganhos: 'Revenus', gastos: 'Dépenses', fixos: 'Fixes', naoFixos: 'Variables',
    saldoTotal: 'Solde total', adicionarCarteira: 'Ajouter un portefeuille', conectarBanco: 'Connecter une banque',
    conta: 'Compte', seguranca: 'Sécurité', aparencia: 'Apparence', tema: 'Thème', moeda: 'Devise',
    idioma: 'Langue', sessao: 'Session', sairDaConta: 'Se déconnecter', zonaDaPerigo: 'Zone de danger',
    excluirConta: 'Supprimer le compte', alterarSenha: 'Changer le mot de passe', alterarNome: 'Changer le nom',
    entrar: 'Se connecter', criarConta: 'Créer un compte', esqueciSenha: 'Mot de passe oublié',
    bemVindo: 'Bienvenue sur Flowly', ouContinueCom: 'Ou continuer avec',
    naoTemConta: 'Pas de compte?', jaTemConta: 'Déjà un compte?',
    email: 'E-mail', senha: 'Mot de passe', nomeCompleto: 'Nom complet',
    conectarBancoDesc: 'Importez automatiquement vos transactions des 2 derniers mois.',
    importacaoConcluida: 'Importation terminée!', algoDeuErrado: 'Quelque chose a mal tourné',
    tentarNovamente: 'Réessayer', conectarOutroBanco: 'Connecter une autre banque',
    entrada: 'Revenu', saida: 'Dépense', copiar: 'Copier', duplicar: 'Dupliquer', mover: 'Déplacer', apagar: 'Supprimer',
    nome: 'Nom', escolherTema: 'Choisir le thème', escolherMoeda: 'Choisir la devise', escolherIdioma: 'Choisir la langue',
    salvar: 'Enregistrer', excluirMinhaConta: 'Supprimer mon compte',
    excluirContaDesc: 'Supprime définitivement toutes vos données',
    excluirContaConfirmacao: 'Cette action est irréversible. Toutes vos données seront supprimées définitivement. Entrez votre mot de passe pour confirmer.',
    novaTransacao: 'Nouvelle Transaction', copiarTransacao: 'Copier la Transaction', transacaoSalva: 'Fait ! Transaction enregistrée.',
  },
  it: {
    transacoes: 'Transazioni', carteiras: 'Portafogli', bancos: 'Banche', configuracoes: 'Impostazioni',
    adicionarTransacao: 'Aggiungi transazione', pesquisar: 'Cerca transazioni...', todos: 'Tutti',
    ganhos: 'Entrate', gastos: 'Uscite', fixos: 'Fissi', naoFixos: 'Variabili',
    saldoTotal: 'Saldo totale', adicionarCarteira: 'Aggiungi portafoglio', conectarBanco: 'Collega banca',
    conta: 'Account', seguranca: 'Sicurezza', aparencia: 'Aspetto', tema: 'Tema', moeda: 'Valuta',
    idioma: 'Lingua', sessao: 'Sessione', sairDaConta: 'Disconnetti', zonaDaPerigo: 'Zona pericolosa',
    excluirConta: 'Elimina account', alterarSenha: 'Cambia password', alterarNome: 'Cambia nome',
    entrar: 'Accedi', criarConta: 'Crea account', esqueciSenha: 'Password dimenticata',
    bemVindo: 'Benvenuto su Flowly', ouContinueCom: 'O continua con',
    naoTemConta: 'Non hai un account?', jaTemConta: 'Hai già un account?',
    email: 'Email', senha: 'Password', nomeCompleto: 'Nome completo',
    conectarBancoDesc: 'Importa automaticamente le tue transazioni degli ultimi 2 mesi.',
    importacaoConcluida: 'Importazione completata!', algoDeuErrado: 'Qualcosa è andato storto',
    tentarNovamente: 'Riprova', conectarOutroBanco: 'Collega un\'altra banca',
    entrada: 'Entrata', saida: 'Uscita', copiar: 'Copia', duplicar: 'Duplica', mover: 'Sposta', apagar: 'Elimina',
    nome: 'Nome', escolherTema: 'Scegli tema', escolherMoeda: 'Scegli valuta', escolherIdioma: 'Scegli lingua',
    salvar: 'Salva', excluirMinhaConta: 'Elimina il mio account',
    excluirContaDesc: 'Rimuove tutti i tuoi dati permanentemente',
    excluirContaConfirmacao: 'Questa azione è irreversibile. Tutti i tuoi dati verranno eliminati definitivamente. Inserisci la tua password per confermare.',
    novaTransacao: 'Nuova Transazione', copiarTransacao: 'Copia Transazione', transacaoSalva: 'Fatto! Transazione salvata.',
  },
};

export function useTranslation() {
  const { idioma } = usePreferences();
  return (key: TranslationKey): string => t[idioma][key] ?? t['pt'][key];
}

// ── Preferences ────────────────────────────────────────────────────────────

export interface Preferences {
  tema: Tema;
  moeda: Moeda;
  idioma: Idioma;
}

const DEFAULT: Preferences = {
  tema: 'claro',
  moeda: MOEDAS[0],
  idioma: 'pt',
};

const KEY = 'flowly:preferences';

function load(): Preferences {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT;
    const parsed = JSON.parse(raw) as Partial<Preferences>;
    return {
      tema: parsed.tema ?? DEFAULT.tema,
      moeda: parsed.moeda ?? DEFAULT.moeda,
      idioma: parsed.idioma ?? DEFAULT.idioma,
    };
  } catch {
    return DEFAULT;
  }
}

function save(p: Preferences) {
  localStorage.setItem(KEY, JSON.stringify(p));
}

type Action =
  | { type: 'SET_TEMA'; payload: Tema }
  | { type: 'SET_MOEDA'; payload: Moeda }
  | { type: 'SET_IDIOMA'; payload: Idioma };

function reducer(state: Preferences, action: Action): Preferences {
  switch (action.type) {
    case 'SET_TEMA':   return { ...state, tema: action.payload };
    case 'SET_MOEDA':  return { ...state, moeda: action.payload };
    case 'SET_IDIOMA': return { ...state, idioma: action.payload };
    default: return state;
  }
}

interface PreferencesContextValue extends Preferences {
  setTema(t: Tema): void;
  setMoeda(m: Moeda): void;
  setIdioma(i: Idioma): void;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);

  useEffect(() => { save(state); }, [state]);

  useEffect(() => {
    const root = document.documentElement;
    const themes: Record<Tema, Record<string, string>> = {
      claro: {
        '--bg': '#f5f7fa', '--surface': '#ffffff', '--surface2': '#f0f2f5',
        '--text': '#1a1a2e', '--text2': '#555', '--border': '#e0e0e0',
        '--primary': '#8b5e6d', '--primary-text': '#ffffff',
        '--nav-bg': '#1565c0', '--nav-text': '#ffffff',
      },
      escuro: {
        '--bg': '#121212', '--surface': '#1e1e1e', '--surface2': '#2a2a2a',
        '--text': '#e8e8e8', '--text2': '#aaa', '--border': '#333',
        '--primary': '#c48b9f', '--primary-text': '#1a1a1a',
        '--nav-bg': '#1a1a1a', '--nav-text': '#e8e8e8',
      },
      creme: {
        '--bg': '#faf6f0', '--surface': '#fffdf8', '--surface2': '#f5efe6',
        '--text': '#3d2b1f', '--text2': '#7a6050', '--border': '#e8ddd0',
        '--primary': '#9b6b4a', '--primary-text': '#ffffff',
        '--nav-bg': '#7a5c3e', '--nav-text': '#fffdf8',
      },
    };
    Object.entries(themes[state.tema]).forEach(([k, v]) => root.style.setProperty(k, v));
  }, [state.tema]);

  return (
    <PreferencesContext.Provider value={{
      ...state,
      setTema:   (t) => dispatch({ type: 'SET_TEMA',   payload: t }),
      setMoeda:  (m) => dispatch({ type: 'SET_MOEDA',  payload: m }),
      setIdioma: (i) => dispatch({ type: 'SET_IDIOMA', payload: i }),
    }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences deve ser usado dentro de PreferencesProvider');
  return ctx;
}
