const USERS_KEY = "snapchef_prototype_users";

interface StoredUser {
  userName: string;
  password: string;
}

interface RegisterParams {
  userName: string;
  email: string;
  password: string;
}

interface LoginParams {
  email: string;
  password: string;
}

function getUsers(): Record<string, StoredUser> {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function saveUsers(users: Record<string, StoredUser>) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface AuthUser {
  email: string;
  userName: string;
}

export const DEMO_USER: AuthUser = {
  email: "demo@snapchef.app",
  userName: "Demo Chef",
};

export const authService = {
  register: async ({ userName, email, password }: RegisterParams) => {
    await delay(400);

    const users = getUsers();
    if (users[email]) {
      throw new Error("User already registered with this email");
    }

    users[email] = { userName, password };
    saveUsers(users);

    return { user: { email, user_metadata: { display_name: userName } } };
  },

  login: async ({ email, password }: LoginParams) => {
    await delay(400);

    const user = getUsers()[email];
    if (!user || user.password !== password) {
      throw new Error("Invalid email or password");
    }

    return { user: { email, user_metadata: { display_name: user.userName } } };
  },

  demoLogin: async (): Promise<{ user: AuthUser }> => {
    await delay(300);
    return { user: DEMO_USER };
  },
};
