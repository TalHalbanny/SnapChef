import {
  addDoc,
  collection,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore";
import { COLLECTIONS, getDb, isFirebaseConfigured } from "./firebase";

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin";
const ADMIN_EMAIL = "admin@snapchef.app";
const LOCAL_USERS_KEY = "snapchef_local_users";

export interface AuthUser {
  email: string;
  userName: string;
}

export type FirestoreUser = {
  id: string;
  username: string;
  email: string;
  password: string;
};

interface RegisterParams {
  userName: string;
  email: string;
  password: string;
}

interface LoginParams {
  username: string;
  password: string;
}

type LocalUser = {
  username: string;
  email: string;
  password: string;
};

function toAuthUser(row: Pick<FirestoreUser, "username" | "email">) {
  return {
    user: {
      email: row.email,
      user_metadata: { display_name: row.username },
    },
  };
}

function isDuplicateUserError(message: string) {
  return (
    message.includes("duplicate") ||
    message.includes("already exists") ||
    message.includes("unique") ||
    message.includes("already registered")
  );
}

function readLocalUsers(): LocalUser[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) ?? "[]") as LocalUser[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalUsers(users: LocalUser[]) {
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
}

function ensureLocalAdmin() {
  const users = readLocalUsers();
  if (users.some((user) => user.username === ADMIN_USERNAME || user.email === ADMIN_EMAIL)) {
    return;
  }
  writeLocalUsers([
    ...users,
    { username: ADMIN_USERNAME, email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  ]);
}

function registerLocally({ userName, email, password }: RegisterParams) {
  const users = readLocalUsers();
  const username = userName.trim();
  const normalizedEmail = email.trim().toLowerCase();

  if (users.some((user) => user.username === username || user.email === normalizedEmail)) {
    throw new Error("User already registered with this email");
  }

  writeLocalUsers([...users, { username, email: normalizedEmail, password }]);
  return toAuthUser({ username, email: normalizedEmail });
}

function loginLocally({ username, password }: LoginParams) {
  ensureLocalAdmin();
  const identifier = username.trim();
  const user = readLocalUsers().find(
    (row) =>
      row.password === password &&
      (row.username === identifier || row.email.toLowerCase() === identifier.toLowerCase()),
  );

  if (!user) {
    throw new Error("Invalid email or password");
  }

  return toAuthUser(user);
}

function mapUserDoc(id: string, data: Record<string, unknown>): FirestoreUser {
  return {
    id,
    username: String(data.username ?? ""),
    email: String(data.email ?? ""),
    password: String(data.password ?? ""),
  };
}

async function findUserByField(field: "username" | "email", value: string) {
  const snap = await getDocs(
    query(collection(getDb(), COLLECTIONS.users), where(field, "==", value), limit(1)),
  );
  const doc = snap.docs[0];
  return doc ? mapUserDoc(doc.id, doc.data()) : null;
}

async function findRemoteUser(identifier: string) {
  const byUsername = await findUserByField("username", identifier);
  if (byUsername) {
    return byUsername;
  }
  return findUserByField("email", identifier);
}

async function createRemoteUser({ userName, email, password }: RegisterParams) {
  const username = userName.trim();
  const normalizedEmail = email.trim().toLowerCase();

  const existingUsername = await findUserByField("username", username);
  const existingEmail = await findUserByField("email", normalizedEmail);
  if (existingUsername || existingEmail) {
    throw new Error("User already registered with this email");
  }

  const created = await addDoc(collection(getDb(), COLLECTIONS.users), {
    username,
    email: normalizedEmail,
    password,
  });

  return { id: created.id, username, email: normalizedEmail, password };
}

export const authService = {
  ensureAdminUser: async () => {
    if (!isFirebaseConfigured()) {
      ensureLocalAdmin();
      return;
    }

    const existing = await findRemoteUser(ADMIN_USERNAME);
    if (existing) {
      return;
    }

    try {
      await createRemoteUser({
        userName: ADMIN_USERNAME,
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!isDuplicateUserError(message)) {
        throw error instanceof Error ? error : new Error(message);
      }
    }
  },

  register: async ({ userName, email, password }: RegisterParams) => {
    if (!isFirebaseConfigured()) {
      return registerLocally({ userName, email, password });
    }

    const user = await createRemoteUser({ userName, email, password });
    return toAuthUser(user);
  },

  login: async ({ username, password }: LoginParams) => {
    if (!isFirebaseConfigured()) {
      return loginLocally({ username, password });
    }

    const row = await findRemoteUser(username.trim());
    if (!row || row.password !== password) {
      throw new Error("Invalid email or password");
    }

    return toAuthUser(row);
  },
};

export async function getRemoteUser(username: string) {
  if (!isFirebaseConfigured()) {
    return null;
  }
  return findRemoteUser(username.trim());
}
