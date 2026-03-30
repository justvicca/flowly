// Feature: flowly-auth, Property 12: serialização de UserProfile é round-trip
import { test, expect } from 'vitest';
import * as fc from 'fast-check';
import type { UserProfile } from './IAuthRepository';

/**
 * Propriedade 12: Serialização de UserProfile é round-trip
 * Valida: Requisito 10.5
 */
test('P12: serializar e desserializar UserProfile produz objeto equivalente', () => {
  fc.assert(
    fc.property(
      fc.record({
        id: fc.uuid(),
        nome: fc.string({ minLength: 1 }),
        email: fc.emailAddress(),
        fotoPerfil: fc.option(fc.webUrl(), { nil: undefined }),
      }),
      (perfil: UserProfile) => {
        const serializado = JSON.stringify(perfil);
        const desserializado: UserProfile = JSON.parse(serializado);

        return (
          desserializado.id === perfil.id &&
          desserializado.nome === perfil.nome &&
          desserializado.email === perfil.email &&
          desserializado.fotoPerfil === perfil.fotoPerfil
        );
      }
    ),
    { numRuns: 100 }
  );
});
