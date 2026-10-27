import assert from "node:assert/strict";
import test from "node:test";

import {
  participantAccessUrl,
  verifyParticipantAccessSignature,
} from "../lib/participant-link";
import { canonicalEmail } from "../lib/security";

const secret = "segredo-de-teste-com-tamanho-suficiente";
const participantId = "507f1f77bcf86cd799439011";

test("link de confirmação aceita somente a assinatura correta", () => {
  const url = new URL(participantAccessUrl("https://app.exemplo.com", participantId, secret));
  const signature = url.searchParams.get("sig") ?? "";

  assert.equal(url.pathname, `/api/public/participants/${participantId}/confirm`);
  assert.equal(verifyParticipantAccessSignature(participantId, signature, secret), true);
  assert.equal(verifyParticipantAccessSignature(participantId, `${signature}x`, secret), false);
  assert.equal(verifyParticipantAccessSignature(participantId, signature, "outro-segredo"), false);
  assert.equal(
    verifyParticipantAccessSignature("507f1f77bcf86cd799439012", signature, secret),
    false,
  );
  assert.equal(verifyParticipantAccessSignature("invalido", signature, secret), false);
});

test("e-mail canônico detecta aliases usados em autorreferência", () => {
  assert.equal(canonicalEmail("Fulano+1@Gmail.com"), "fulano@gmail.com");
  assert.equal(canonicalEmail("f.u.lano@googlemail.com"), "fulano@gmail.com");
  assert.equal(canonicalEmail("nome+tag@empresa.com.br"), "nome@empresa.com.br");
  assert.equal(canonicalEmail("nome.sobrenome@empresa.com.br"), "nome.sobrenome@empresa.com.br");
});
