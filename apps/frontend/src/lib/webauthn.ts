// ----------------------------------------------------------------------

export type PublicKeyCredentialDescriptorJson = {
  id: string;
  type: PublicKeyCredentialType;
  transports?: AuthenticatorTransport[];
};

export type PublicKeyCredentialCreationOptionsJson = {
  challenge: string;
  rp: PublicKeyCredentialRpEntity;
  user: {
    id: string;
    name: string;
    displayName: string;
  };
  pubKeyCredParams: PublicKeyCredentialParameters[];
  timeout?: number;
  excludeCredentials?: PublicKeyCredentialDescriptorJson[];
  authenticatorSelection?: AuthenticatorSelectionCriteria;
  attestation?: AttestationConveyancePreference;
  extensions?: AuthenticationExtensionsClientInputs;
};

export type PublicKeyCredentialRequestOptionsJson = {
  challenge: string;
  rpId?: string;
  timeout?: number;
  allowCredentials?: PublicKeyCredentialDescriptorJson[];
  userVerification?: UserVerificationRequirement;
  extensions?: AuthenticationExtensionsClientInputs;
};

export type SerializedRegistrationCredential = {
  id: string;
  rawId: string;
  type: 'public-key';
  authenticatorAttachment?: string | null;
  clientExtensionResults: AuthenticationExtensionsClientOutputs;
  response: {
    clientDataJSON: string;
    attestationObject: string;
    transports?: string[];
  };
};

export type SerializedAssertionCredential = {
  id: string;
  rawId: string;
  type: 'public-key';
  authenticatorAttachment?: string | null;
  clientExtensionResults: AuthenticationExtensionsClientOutputs;
  response: {
    clientDataJSON: string;
    authenticatorData: string;
    signature: string;
    userHandle?: string;
  };
};

// ----------------------------------------------------------------------

export type PasskeyClientErrorCode =
  | 'UNSUPPORTED'
  | 'CANCELLED'
  | 'ALREADY_REGISTERED'
  | 'SECURITY_ERROR'
  | 'UNKNOWN';

/**
 * Erro local da cerimônia WebAuthn no navegador (sem suporte, cancelamento,
 * credencial duplicada ou bloqueio de segurança do browser).
 */
export class PasskeyClientError extends Error {
  readonly code: PasskeyClientErrorCode;

  constructor(code: PasskeyClientErrorCode, message: string, cause?: unknown) {
    super(message, { cause });
    this.name = 'PasskeyClientError';
    this.code = code;
  }
}

export function isPasskeyClientError(error: unknown): error is PasskeyClientError {
  return error instanceof PasskeyClientError;
}

export function toPasskeyClientError(error: unknown): PasskeyClientError {
  if (isPasskeyClientError(error)) {
    return error;
  }

  const errorName = error instanceof Error ? error.name : '';

  switch (errorName) {
    case 'NotAllowedError':
    case 'AbortError':
      return new PasskeyClientError(
        'CANCELLED',
        'A operação com a passkey foi cancelada ou o tempo esgotou.',
        error
      );
    case 'InvalidStateError':
      return new PasskeyClientError(
        'ALREADY_REGISTERED',
        'Este dispositivo já possui uma passkey cadastrada para esta conta.',
        error
      );
    case 'SecurityError':
      return new PasskeyClientError(
        'SECURITY_ERROR',
        'O navegador bloqueou o uso de passkeys neste endereço por segurança.',
        error
      );
    case 'NotSupportedError':
      return new PasskeyClientError(
        'UNSUPPORTED',
        'Este navegador ou dispositivo não oferece suporte a passkeys.',
        error
      );
    default:
      return new PasskeyClientError(
        'UNKNOWN',
        'Não foi possível concluir a cerimônia com a passkey no navegador.',
        error
      );
  }
}

// ----------------------------------------------------------------------

export function isPasskeySupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.PublicKeyCredential !== 'undefined' &&
    Boolean(navigator.credentials?.create) &&
    Boolean(navigator.credentials?.get)
  );
}

export function base64UrlToUint8Array(value: string): Uint8Array<ArrayBuffer> {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = (4 - (base64.length % 4)) % 4;
  const padded = base64 + '='.repeat(padding);
  const binary = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

export function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';

  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// ----------------------------------------------------------------------

export function toCreationOptions(
  options: PublicKeyCredentialCreationOptionsJson
): PublicKeyCredentialCreationOptions {
  return {
    ...options,
    challenge: base64UrlToUint8Array(options.challenge),
    user: {
      ...options.user,
      id: base64UrlToUint8Array(options.user.id),
    },
    excludeCredentials: options.excludeCredentials?.map((credential) => ({
      ...credential,
      id: base64UrlToUint8Array(credential.id),
    })),
  };
}

export function toRequestOptions(
  options: PublicKeyCredentialRequestOptionsJson
): PublicKeyCredentialRequestOptions {
  return {
    ...options,
    challenge: base64UrlToUint8Array(options.challenge),
    allowCredentials: options.allowCredentials?.map((credential) => ({
      ...credential,
      id: base64UrlToUint8Array(credential.id),
    })),
  };
}

export function serializeRegistrationCredential(
  credential: PublicKeyCredential
): SerializedRegistrationCredential {
  const response = credential.response as AuthenticatorAttestationResponse & {
    getTransports?: () => string[];
  };

  const transports = typeof response.getTransports === 'function' ? response.getTransports() : undefined;

  return {
    id: credential.id,
    rawId: arrayBufferToBase64Url(credential.rawId),
    type: 'public-key',
    ...(credential.authenticatorAttachment
      ? { authenticatorAttachment: credential.authenticatorAttachment }
      : {}),
    clientExtensionResults: credential.getClientExtensionResults?.() ?? {},
    response: {
      clientDataJSON: arrayBufferToBase64Url(response.clientDataJSON),
      attestationObject: arrayBufferToBase64Url(response.attestationObject),
      ...(transports ? { transports } : {}),
    },
  };
}

export function serializeAssertionCredential(
  credential: PublicKeyCredential
): SerializedAssertionCredential {
  const response = credential.response as AuthenticatorAssertionResponse;
  const userHandle =
    response.userHandle && response.userHandle.byteLength > 0
      ? arrayBufferToBase64Url(response.userHandle)
      : undefined;

  return {
    id: credential.id,
    rawId: arrayBufferToBase64Url(credential.rawId),
    type: 'public-key',
    ...(credential.authenticatorAttachment
      ? { authenticatorAttachment: credential.authenticatorAttachment }
      : {}),
    clientExtensionResults: credential.getClientExtensionResults?.() ?? {},
    response: {
      clientDataJSON: arrayBufferToBase64Url(response.clientDataJSON),
      authenticatorData: arrayBufferToBase64Url(response.authenticatorData),
      signature: arrayBufferToBase64Url(response.signature),
      ...(userHandle ? { userHandle } : {}),
    },
  };
}

// ----------------------------------------------------------------------

export async function createPasskeyCredential(
  options: PublicKeyCredentialCreationOptionsJson
): Promise<SerializedRegistrationCredential> {
  if (!isPasskeySupported()) {
    throw new PasskeyClientError(
      'UNSUPPORTED',
      'Este navegador ou dispositivo não oferece suporte a passkeys.'
    );
  }

  try {
    const credential = await navigator.credentials.create({
      publicKey: toCreationOptions(options),
    });

    if (!(credential instanceof PublicKeyCredential)) {
      throw new PasskeyClientError(
        'CANCELLED',
        'Nenhuma passkey foi criada. Tente novamente.'
      );
    }

    return serializeRegistrationCredential(credential);
  } catch (error) {
    throw toPasskeyClientError(error);
  }
}

export async function getPasskeyCredential(
  options: PublicKeyCredentialRequestOptionsJson
): Promise<SerializedAssertionCredential> {
  if (!isPasskeySupported()) {
    throw new PasskeyClientError(
      'UNSUPPORTED',
      'Este navegador ou dispositivo não oferece suporte a passkeys.'
    );
  }

  try {
    const credential = await navigator.credentials.get({
      publicKey: toRequestOptions(options),
    });

    if (!(credential instanceof PublicKeyCredential)) {
      throw new PasskeyClientError(
        'CANCELLED',
        'Nenhuma passkey foi selecionada. Tente novamente.'
      );
    }

    return serializeAssertionCredential(credential);
  } catch (error) {
    throw toPasskeyClientError(error);
  }
}
