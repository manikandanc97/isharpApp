export function selectAccessToken(input: {
  authorization?: string | null;
  developmentToken?: string | null;
  supabaseToken?: string | null;
}) {
  const bearer = input.authorization?.match(/^Bearer\s+(\S+)$/i)?.[1];
  return bearer ?? input.developmentToken ?? input.supabaseToken ?? null;
}
