type AuthUser = {
  id: string;
  email: string;
  name: string;
  isRegistered: boolean;
  role?: "LEADER" | "MEMBER" | null;  // ✅ allow null
  teamId?: string | null;   
  teamName?: string | null;          // ✅ allow null
};