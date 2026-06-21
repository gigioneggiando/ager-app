/** Non-sensitive session info shared between server (decode) and client (display). */
export interface Session {
  userId: string;
  email: string | null;
  role: string;
}
