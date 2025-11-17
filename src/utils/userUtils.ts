import UserDAO from '@dao/userDAO';

export async function generateUsername(
  firstName: string,
  lastName: string,
  username?: string | undefined,
): Promise<string> {
  if (username?.trim()) {
    return username.trim();
  }

  // Generate a username: firstName_lastName, all lowercase, remove spaces, allow numbers/underscores
  let base = `${firstName}_${lastName}`.replace(/\s+/g, '').toLowerCase();
  let candidate = base;
  let suffix = 1;
  // Ensure uniqueness
  while (await UserDAO.get({ filter: { username: candidate } })) {
    candidate = `${base}_${suffix}`;
    suffix++;
  }
  return candidate;
}
