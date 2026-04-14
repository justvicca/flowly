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
  | 'novaTransacao' | 'copiarTransacao' | 'transacaoSalva'
  // TransactionForm
  | 'descricao' | 'valor' | 'data' | 'tipo' | 'carteira' | 'recorrencia' | 'cancelar'
  | 'salvando' | 'transacaoSalvaForm' | 'placeholder_descricao' | 'placeholder_valor'
  // TransactionList
  | 'nenhumaTransacao' | 'transacaoRemovida' | 'confirmarRemocao'
  // WalletList
  | 'saldoTotalLabel' | 'nenhumaCarteira' | 'adicionarCarteiraLabel' | 'nomeCarteira'
  | 'placeholder_carteira' | 'salvandoCarteira' | 'cancelarCarteira'
  // ConfirmDialog
  | 'confirmar'
  // BankConnectionScreen
  | 'conectarBancoTitulo' | 'conectarContaBancaria' | 'abrindoConexao' | 'importandoTransacoes'
  | 'buscandoTransacoes' | 'transacoesImportadas' | 'segurancaBancaria'
  // Auth screens
  | 'bemVindoFlowly' | 'criarContaFlowly' | 'entrando' | 'criandoConta'
  | 'esqueceuSenha' | 'recuperarSenha' | 'enviarLink' | 'enviando' | 'voltarLogin'
  | 'linkEnviado' | 'verificarCaixa' | 'ocultarSenha' | 'mostrarSenha'
  | 'placeholder_email' | 'placeholder_senha' | 'placeholder_senhaMin' | 'placeholder_nomeCompleto'
  | 'erroNomeVazio' | 'erroEmailInvalido' | 'erroSenhaCurta';

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
    descricao: 'Descrição', valor: 'Valor (R$)', data: 'Data', tipo: 'Tipo', carteira: 'Carteira',
    recorrencia: 'Recorrência', cancelar: 'Cancelar', salvando: 'Salvando...', transacaoSalvaForm: '✓ Pronto! A transação foi salva.',
    placeholder_descricao: 'Ex: Aluguel, Salário...', placeholder_valor: '0,00',
    nenhumaTransacao: 'Nenhuma transação encontrada.', transacaoRemovida: 'Pronto! A transação foi removida.',
    confirmarRemocao: 'Tem certeza que deseja apagar esta transação? Esta ação não pode ser desfeita.',
    saldoTotalLabel: 'Saldo Total', nenhumaCarteira: 'Nenhuma carteira cadastrada.',
    adicionarCarteiraLabel: 'Adicionar Carteira', nomeCarteira: 'Nome da carteira',
    placeholder_carteira: 'Ex: Banco do Brasil', salvandoCarteira: 'Salvando...', cancelarCarteira: 'Cancelar',
    confirmar: 'Confirmar',
    conectarBancoTitulo: 'Conectar banco', conectarContaBancaria: 'Conecte sua conta bancária',
    abrindoConexao: 'Abrindo conexão segura...', importandoTransacoes: 'Importando transações',
    buscandoTransacoes: 'Buscando suas transações...', transacoesImportadas: 'transações importadas com sucesso.',
    segurancaBancaria: '🔒 Seus dados bancários são acessados de forma segura via Open Finance. O Flowly nunca armazena suas credenciais bancárias.',
    bemVindoFlowly: 'Bem-vindo ao Flowly', criarContaFlowly: 'Criar conta no Flowly',
    entrando: 'Entrando...', criandoConta: 'Criando conta...',
    esqueceuSenha: 'Esqueci minha senha', recuperarSenha: 'Recuperar senha',
    enviarLink: 'Enviar link de recuperação', enviando: 'Enviando...', voltarLogin: 'Voltar para login',
    linkEnviado: 'Enviamos um link para', verificarCaixa: 'Verifique sua caixa de entrada.',
    ocultarSenha: 'Ocultar senha', mostrarSenha: 'Mostrar senha',
    placeholder_email: 'Email', placeholder_senha: 'Senha', placeholder_senhaMin: 'Senha (mín. 8 caracteres)',
    placeholder_nomeCompleto: 'Nome completo',
    erroNomeVazio: 'Digite seu nome completo.', erroEmailInvalido: 'Digite um email válido, como exemplo@email.com.',
    erroSenhaCurta: 'A senha precisa ter pelo menos 8 caracteres.',
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
    descricao: 'Description', valor: 'Amount', data: 'Date', tipo: 'Type', carteira: 'Wallet',
    recorrencia: 'Recurrence', cancelar: 'Cancel', salvando: 'Saving...', transacaoSalvaForm: '✓ Done! Transaction saved.',
    placeholder_descricao: 'E.g.: Rent, Salary...', placeholder_valor: '0.00',
    nenhumaTransacao: 'No transactions found.', transacaoRemovida: 'Done! Transaction removed.',
    confirmarRemocao: 'Are you sure you want to delete this transaction? This action cannot be undone.',
    saldoTotalLabel: 'Total Balance', nenhumaCarteira: 'No wallets registered.',
    adicionarCarteiraLabel: 'Add Wallet', nomeCarteira: 'Wallet name',
    placeholder_carteira: 'E.g.: Bank of America', salvandoCarteira: 'Saving...', cancelarCarteira: 'Cancel',
    confirmar: 'Confirm',
    conectarBancoTitulo: 'Connect bank', conectarContaBancaria: 'Connect your bank account',
    abrindoConexao: 'Opening secure connection...', importandoTransacoes: 'Importing transactions',
    buscandoTransacoes: 'Fetching your transactions...', transacoesImportadas: 'transactions imported successfully.',
    segurancaBancaria: '🔒 Your banking data is accessed securely via Open Finance. Flowly never stores your banking credentials.',
    bemVindoFlowly: 'Welcome to Flowly', criarContaFlowly: 'Create a Flowly account',
    entrando: 'Signing in...', criandoConta: 'Creating account...',
    esqueceuSenha: 'Forgot my password', recuperarSenha: 'Recover password',
    enviarLink: 'Send recovery link', enviando: 'Sending...', voltarLogin: 'Back to login',
    linkEnviado: 'We sent a link to', verificarCaixa: 'Check your inbox.',
    ocultarSenha: 'Hide password', mostrarSenha: 'Show password',
    placeholder_email: 'Email', placeholder_senha: 'Password', placeholder_senhaMin: 'Password (min. 8 characters)',
    placeholder_nomeCompleto: 'Full name',
    erroNomeVazio: 'Enter your full name.', erroEmailInvalido: 'Enter a valid email, like example@email.com.',
    erroSenhaCurta: 'Password must be at least 8 characters.',
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
    descricao: 'Beschreibung', valor: 'Betrag', data: 'Datum', tipo: 'Typ', carteira: 'Konto',
    recorrencia: 'Wiederholung', cancelar: 'Abbrechen', salvando: 'Speichern...', transacaoSalvaForm: '✓ Fertig! Transaktion gespeichert.',
    placeholder_descricao: 'z.B.: Miete, Gehalt...', placeholder_valor: '0,00',
    nenhumaTransacao: 'Keine Transaktionen gefunden.', transacaoRemovida: 'Fertig! Transaktion gelöscht.',
    confirmarRemocao: 'Möchten Sie diese Transaktion wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.',
    saldoTotalLabel: 'Gesamtguthaben', nenhumaCarteira: 'Keine Konten registriert.',
    adicionarCarteiraLabel: 'Konto hinzufügen', nomeCarteira: 'Kontoname',
    placeholder_carteira: 'z.B.: Deutsche Bank', salvandoCarteira: 'Speichern...', cancelarCarteira: 'Abbrechen',
    confirmar: 'Bestätigen',
    conectarBancoTitulo: 'Bank verbinden', conectarContaBancaria: 'Bankkonto verbinden',
    abrindoConexao: 'Sichere Verbindung wird geöffnet...', importandoTransacoes: 'Transaktionen werden importiert',
    buscandoTransacoes: 'Transaktionen werden abgerufen...', transacoesImportadas: 'Transaktionen erfolgreich importiert.',
    segurancaBancaria: '🔒 Ihre Bankdaten werden sicher über Open Finance abgerufen. Flowly speichert niemals Ihre Bankdaten.',
    bemVindoFlowly: 'Willkommen bei Flowly', criarContaFlowly: 'Flowly-Konto erstellen',
    entrando: 'Anmelden...', criandoConta: 'Konto wird erstellt...',
    esqueceuSenha: 'Passwort vergessen', recuperarSenha: 'Passwort wiederherstellen',
    enviarLink: 'Wiederherstellungslink senden', enviando: 'Senden...', voltarLogin: 'Zurück zur Anmeldung',
    linkEnviado: 'Wir haben einen Link gesendet an', verificarCaixa: 'Überprüfen Sie Ihren Posteingang.',
    ocultarSenha: 'Passwort verbergen', mostrarSenha: 'Passwort anzeigen',
    placeholder_email: 'E-Mail', placeholder_senha: 'Passwort', placeholder_senhaMin: 'Passwort (mind. 8 Zeichen)',
    placeholder_nomeCompleto: 'Vollständiger Name',
    erroNomeVazio: 'Geben Sie Ihren vollständigen Namen ein.', erroEmailInvalido: 'Geben Sie eine gültige E-Mail ein, z.B. beispiel@email.com.',
    erroSenhaCurta: 'Das Passwort muss mindestens 8 Zeichen lang sein.',
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
    descricao: 'Descripción', valor: 'Monto', data: 'Fecha', tipo: 'Tipo', carteira: 'Cartera',
    recorrencia: 'Recurrencia', cancelar: 'Cancelar', salvando: 'Guardando...', transacaoSalvaForm: '✓ ¡Listo! Transacción guardada.',
    placeholder_descricao: 'Ej: Alquiler, Salario...', placeholder_valor: '0,00',
    nenhumaTransacao: 'No se encontraron transacciones.', transacaoRemovida: '¡Listo! Transacción eliminada.',
    confirmarRemocao: '¿Estás seguro de que deseas eliminar esta transacción? Esta acción no se puede deshacer.',
    saldoTotalLabel: 'Saldo total', nenhumaCarteira: 'No hay carteras registradas.',
    adicionarCarteiraLabel: 'Agregar cartera', nomeCarteira: 'Nombre de la cartera',
    placeholder_carteira: 'Ej: Banco Santander', salvandoCarteira: 'Guardando...', cancelarCarteira: 'Cancelar',
    confirmar: 'Confirmar',
    conectarBancoTitulo: 'Conectar banco', conectarContaBancaria: 'Conecta tu cuenta bancaria',
    abrindoConexao: 'Abriendo conexión segura...', importandoTransacoes: 'Importando transacciones',
    buscandoTransacoes: 'Buscando tus transacciones...', transacoesImportadas: 'transacciones importadas con éxito.',
    segurancaBancaria: '🔒 Tus datos bancarios se acceden de forma segura a través de Open Finance. Flowly nunca almacena tus credenciales bancarias.',
    bemVindoFlowly: 'Bienvenido a Flowly', criarContaFlowly: 'Crear cuenta en Flowly',
    entrando: 'Iniciando sesión...', criandoConta: 'Creando cuenta...',
    esqueceuSenha: 'Olvidé mi contraseña', recuperarSenha: 'Recuperar contraseña',
    enviarLink: 'Enviar enlace de recuperación', enviando: 'Enviando...', voltarLogin: 'Volver al inicio de sesión',
    linkEnviado: 'Enviamos un enlace a', verificarCaixa: 'Revisa tu bandeja de entrada.',
    ocultarSenha: 'Ocultar contraseña', mostrarSenha: 'Mostrar contraseña',
    placeholder_email: 'Correo', placeholder_senha: 'Contraseña', placeholder_senhaMin: 'Contraseña (mín. 8 caracteres)',
    placeholder_nomeCompleto: 'Nombre completo',
    erroNomeVazio: 'Ingresa tu nombre completo.', erroEmailInvalido: 'Ingresa un correo válido, como ejemplo@email.com.',
    erroSenhaCurta: 'La contraseña debe tener al menos 8 caracteres.',
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
    descricao: 'Description', valor: 'Montant', data: 'Date', tipo: 'Type', carteira: 'Portefeuille',
    recorrencia: 'Récurrence', cancelar: 'Annuler', salvando: 'Enregistrement...', transacaoSalvaForm: '✓ Fait ! Transaction enregistrée.',
    placeholder_descricao: 'Ex : Loyer, Salaire...', placeholder_valor: '0,00',
    nenhumaTransacao: 'Aucune transaction trouvée.', transacaoRemovida: 'Fait ! Transaction supprimée.',
    confirmarRemocao: 'Êtes-vous sûr de vouloir supprimer cette transaction ? Cette action est irréversible.',
    saldoTotalLabel: 'Solde total', nenhumaCarteira: 'Aucun portefeuille enregistré.',
    adicionarCarteiraLabel: 'Ajouter un portefeuille', nomeCarteira: 'Nom du portefeuille',
    placeholder_carteira: 'Ex : BNP Paribas', salvandoCarteira: 'Enregistrement...', cancelarCarteira: 'Annuler',
    confirmar: 'Confirmer',
    conectarBancoTitulo: 'Connecter une banque', conectarContaBancaria: 'Connectez votre compte bancaire',
    abrindoConexao: 'Ouverture de la connexion sécurisée...', importandoTransacoes: 'Importation des transactions',
    buscandoTransacoes: 'Récupération de vos transactions...', transacoesImportadas: 'transactions importées avec succès.',
    segurancaBancaria: '🔒 Vos données bancaires sont accessibles de manière sécurisée via Open Finance. Flowly ne stocke jamais vos identifiants bancaires.',
    bemVindoFlowly: 'Bienvenue sur Flowly', criarContaFlowly: 'Créer un compte Flowly',
    entrando: 'Connexion...', criandoConta: 'Création du compte...',
    esqueceuSenha: 'Mot de passe oublié', recuperarSenha: 'Récupérer le mot de passe',
    enviarLink: 'Envoyer le lien de récupération', enviando: 'Envoi...', voltarLogin: 'Retour à la connexion',
    linkEnviado: 'Nous avons envoyé un lien à', verificarCaixa: 'Vérifiez votre boîte de réception.',
    ocultarSenha: 'Masquer le mot de passe', mostrarSenha: 'Afficher le mot de passe',
    placeholder_email: 'E-mail', placeholder_senha: 'Mot de passe', placeholder_senhaMin: 'Mot de passe (min. 8 caractères)',
    placeholder_nomeCompleto: 'Nom complet',
    erroNomeVazio: 'Entrez votre nom complet.', erroEmailInvalido: 'Entrez un e-mail valide, comme exemple@email.com.',
    erroSenhaCurta: 'Le mot de passe doit comporter au moins 8 caractères.',
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
    descricao: 'Descrizione', valor: 'Importo', data: 'Data', tipo: 'Tipo', carteira: 'Portafoglio',
    recorrencia: 'Ricorrenza', cancelar: 'Annulla', salvando: 'Salvataggio...', transacaoSalvaForm: '✓ Fatto! Transazione salvata.',
    placeholder_descricao: 'Es: Affitto, Stipendio...', placeholder_valor: '0,00',
    nenhumaTransacao: 'Nessuna transazione trovata.', transacaoRemovida: 'Fatto! Transazione eliminata.',
    confirmarRemocao: 'Sei sicuro di voler eliminare questa transazione? Questa azione non può essere annullata.',
    saldoTotalLabel: 'Saldo totale', nenhumaCarteira: 'Nessun portafoglio registrato.',
    adicionarCarteiraLabel: 'Aggiungi portafoglio', nomeCarteira: 'Nome del portafoglio',
    placeholder_carteira: 'Es: Banca Intesa', salvandoCarteira: 'Salvataggio...', cancelarCarteira: 'Annulla',
    confirmar: 'Conferma',
    conectarBancoTitulo: 'Collega banca', conectarContaBancaria: 'Collega il tuo conto bancario',
    abrindoConexao: 'Apertura connessione sicura...', importandoTransacoes: 'Importazione transazioni',
    buscandoTransacoes: 'Recupero delle tue transazioni...', transacoesImportadas: 'transazioni importate con successo.',
    segurancaBancaria: '🔒 I tuoi dati bancari sono accessibili in modo sicuro tramite Open Finance. Flowly non memorizza mai le tue credenziali bancarie.',
    bemVindoFlowly: 'Benvenuto su Flowly', criarContaFlowly: 'Crea un account Flowly',
    entrando: 'Accesso...', criandoConta: 'Creazione account...',
    esqueceuSenha: 'Password dimenticata', recuperarSenha: 'Recupera password',
    enviarLink: 'Invia link di recupero', enviando: 'Invio...', voltarLogin: 'Torna al login',
    linkEnviado: 'Abbiamo inviato un link a', verificarCaixa: 'Controlla la tua casella di posta.',
    ocultarSenha: 'Nascondi password', mostrarSenha: 'Mostra password',
    placeholder_email: 'Email', placeholder_senha: 'Password', placeholder_senhaMin: 'Password (min. 8 caratteri)',
    placeholder_nomeCompleto: 'Nome completo',
    erroNomeVazio: 'Inserisci il tuo nome completo.', erroEmailInvalido: 'Inserisci un\'email valida, come esempio@email.com.',
    erroSenhaCurta: 'La password deve contenere almeno 8 caratteri.',
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
