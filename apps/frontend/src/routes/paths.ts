// ----------------------------------------------------------------------

const ROOTS = {
  CONTA: '/conta',
  ERROR: '/error',
};

// ----------------------------------------------------------------------

export const paths = {
  root: '/',
  // Autenticação
  entrar: '/entrar',
  cadastro: '/cadastro',
  doisFatores: '/2fa',
  // Documentos
  assinar: '/assinar',
  verificar: '/verificar', // pública
  // Conta
  conta: {
    root: ROOTS.CONTA,
    seguranca: `${ROOTS.CONTA}/seguranca`,
    sessoes: `${ROOTS.CONTA}/sessoes`,
    passkeys: `${ROOTS.CONTA}/passkeys`,
    atividade: `${ROOTS.CONTA}/atividade`,
  },
  // Erros
  page403: `${ROOTS.ERROR}/403`,
  page404: `${ROOTS.ERROR}/404`,
  page500: `${ROOTS.ERROR}/500`,
};
