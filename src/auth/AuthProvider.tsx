import React, { useCallback, useMemo, useState } from "react";
import { AuthContext } from "./authContext";
import { MOCK_PASSWORD, mockUsers } from "./mockUsers";
import { users as systemUsers } from "../mock-db/users";
import type { User } from "../mock-db/users";
import type { AuthUser, ModulePermission } from "./types";
import {
  getDefaultModulePermissions,
  normalizePermissionRole,
} from "../logic/permissionEngine";

const AUTH_STORAGE_KEY = "sg_auth_user_id";
const SYSTEM_USERS_STORAGE_KEY = "app_users";
const ALLOWED_GOOGLE_DOMAINS = ["sportgates.lt"];
const DEFAULT_GOOGLE_ROLE: User["role"] = "EXTERNAL";

const normalizeEmail = (email?: string) => email?.trim().toLowerCase() ?? "";
const normalizeRole = normalizePermissionRole;
const getGoogleUserId = (email: string) =>
  `google-${email.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
const getEmailDomain = (email: string) => email.split("@")[1] ?? "";
const isAllowedGoogleDomain = (email: string) =>
  ALLOWED_GOOGLE_DOMAINS.includes(getEmailDomain(email));

interface GoogleProfile {
  email: string;
  name?: string;
  picture?: string;
}

type SystemUserRecord = User & {
  roleId?: string;
  permissions?: ModulePermission[];
  modulePermissions?: ModulePermission[];
  active?: boolean;
};

const getConfiguredModulePermissions = (
  user: SystemUserRecord,
): ModulePermission[] | null => {
  const permissions = user.modulePermissions || user.permissions;
  return Array.isArray(permissions) && permissions.length > 0
    ? permissions
    : null;
};

const ensureModulePermissionsConfig = (
  user: SystemUserRecord,
): SystemUserRecord => {
  const configuredPermissions = getConfiguredModulePermissions(user);
  if (configuredPermissions) {
    return {
      ...user,
      permissions: configuredPermissions,
      modulePermissions: configuredPermissions,
    };
  }

  const defaultPermissions = getDefaultModulePermissions(user.role || user.roleId);
  return {
    ...user,
    permissions: defaultPermissions,
    modulePermissions: defaultPermissions,
  };
};

const mergeUsers = (seedUsers: User[], savedUsers: SystemUserRecord[]) => {
  const merged = new Map<string, SystemUserRecord>();

  seedUsers.forEach((user) => {
    merged.set(normalizeEmail(user.email) || user.id, user);
  });

  savedUsers.forEach((user) => {
    const key = normalizeEmail(user.email) || user.id;
    const existingUser = merged.get(key);
    const savedRole = normalizeRole(user.role || user.roleId);
    const existingRole = normalizeRole(existingUser?.role || existingUser?.roleId);
    const savedIsAutoExternal =
      user.id?.startsWith("google-") && savedRole === DEFAULT_GOOGLE_ROLE;
    const existingIsAdmin =
      existingRole === "SUPER_ADMIN" || existingRole === "ADMIN";

    if (existingUser && savedIsAutoExternal && existingIsAdmin) {
      return;
    }

    merged.set(key, user);
  });

  return Array.from(merged.values());
};

const getSavedUserById = (storedId: string): SystemUserRecord | null => {
  if (typeof window === "undefined") return null;

  try {
    const savedUsers = localStorage.getItem(SYSTEM_USERS_STORAGE_KEY);
    const parsedUsers = savedUsers
      ? (JSON.parse(savedUsers) as SystemUserRecord[])
      : [];
    return parsedUsers.find((user) => user.id === storedId) || null;
  } catch (error) {
    console.debug("[auth] Failed to inspect saved users by id:", error);
    return null;
  }
};

const getSystemUsers = (): SystemUserRecord[] => {
  if (typeof window === "undefined") {
    return systemUsers.map((user) => ensureModulePermissionsConfig(user));
  }

  try {
    const savedUsers = localStorage.getItem(SYSTEM_USERS_STORAGE_KEY);
    const parsedUsers = savedUsers
      ? (JSON.parse(savedUsers) as SystemUserRecord[])
      : [];
    const users = mergeUsers(systemUsers, parsedUsers).map((user) =>
      ensureModulePermissionsConfig(user),
    );
    const repairedSavedUsers = users.filter((user) =>
      parsedUsers.some((savedUser) => savedUser.id === user.id),
    );
    const hasMissingSavedConfig = repairedSavedUsers.some((user) => {
      const savedUser = parsedUsers.find((item) => item.id === user.id);
      return Boolean(savedUser && !getConfiguredModulePermissions(savedUser));
    });
    if (hasMissingSavedConfig) {
      localStorage.setItem(SYSTEM_USERS_STORAGE_KEY, JSON.stringify(repairedSavedUsers));
    }
    console.debug(
      "[auth] Internal users list emails:",
      users.map((user) => ({
        id: user.id,
        email: user.email,
        normalizedEmail: normalizeEmail(user.email),
        role: normalizeRole(user.role || user.roleId),
        active: user.is_active !== false && user.active !== false,
        modulePermissions: user.modulePermissions,
      })),
    );
    return users;
  } catch (error) {
    console.debug("[auth] Failed to load system users:", error);
    return systemUsers.map((user) => ensureModulePermissionsConfig(user));
  }
};

const saveAutoApprovedGoogleUser = (
  profile: GoogleProfile,
  normalizedEmail: string,
): SystemUserRecord | null => {
  if (typeof window === "undefined") return null;

  try {
    const savedUsers = localStorage.getItem(SYSTEM_USERS_STORAGE_KEY);
    const parsedUsers = savedUsers
      ? (JSON.parse(savedUsers) as SystemUserRecord[])
      : [];
    const existingUser = mergeUsers(systemUsers, parsedUsers).find(
      (user) => normalizeEmail(user.email) === normalizedEmail,
    );

    const approvedUser: SystemUserRecord = {
      ...(existingUser || {}),
      id:
        existingUser?.id && !existingUser.id.startsWith("pending-")
          ? existingUser.id
          : getGoogleUserId(normalizedEmail),
      name: existingUser?.name || profile.name || normalizedEmail,
      email: normalizedEmail,
      role: (existingUser?.role || existingUser?.roleId || DEFAULT_GOOGLE_ROLE) as User["role"],
      region: existingUser?.region || "ALL",
      assigned_clubs: existingUser?.assigned_clubs || [],
      is_active: true,
      active: true,
    };
    const approvedUserWithPermissions = ensureModulePermissionsConfig(approvedUser);

    const nextUsers = existingUser
      ? parsedUsers.map((user) =>
          normalizeEmail(user.email) === normalizedEmail ? approvedUserWithPermissions : user,
        )
      : [...parsedUsers, approvedUserWithPermissions];

    if (existingUser && !parsedUsers.some((user) => normalizeEmail(user.email) === normalizedEmail)) {
      nextUsers.push(approvedUserWithPermissions);
    }

    localStorage.setItem(SYSTEM_USERS_STORAGE_KEY, JSON.stringify(nextUsers));
    console.debug("[auth] Auto-approved Google user saved:", {
      id: approvedUserWithPermissions.id,
      email: approvedUserWithPermissions.email,
      role: approvedUserWithPermissions.role,
      active: approvedUserWithPermissions.is_active,
      modulePermissions: approvedUserWithPermissions.modulePermissions,
      source: existingUser ? "existing-system-user" : "new-google-domain-user",
    });
    return approvedUserWithPermissions;
  } catch (error) {
    console.debug("[auth] Failed to save auto-approved Google user:", error);
    return null;
  }
};

const mapSystemUserToAuthUser = (
  user: SystemUserRecord,
  googleProfile?: GoogleProfile,
): AuthUser => {
  const region = user.region || "ALL";
  const role = normalizeRole(user.role || user.roleId) as AuthUser["role"];
  const userWithPermissions = ensureModulePermissionsConfig(user);
  const permissions = userWithPermissions.modulePermissions || getDefaultModulePermissions(role);

  return {
    id: user.id,
    name: user.name || googleProfile?.name || user.email,
    email: normalizeEmail(user.email),
    role,
    region,
    regionAccess: region === "ALL" ? ["ALL"] : [region],
    modulePermissions: permissions,
    is_active: user.is_active !== false && user.active !== false,
    avatarUrl: googleProfile?.picture,
  };
};

const persistUser = (user: AuthUser, remember: boolean) => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  sessionStorage.removeItem(AUTH_STORAGE_KEY);

  const storage = remember ? localStorage : sessionStorage;
  storage.setItem(AUTH_STORAGE_KEY, user.id);
};

const decodeGoogleProfile = (credential: string): GoogleProfile | null => {
  try {
    const payload = credential.split(".")[1];
    if (!payload) return null;

    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decodedPayload = JSON.parse(
      decodeURIComponent(
        atob(normalizedPayload)
          .split("")
          .map(
            (char) =>
              `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`,
          )
          .join(""),
      ),
    );

    if (typeof decodedPayload.email !== "string") return null;

    return {
      email: decodedPayload.email,
      name:
        typeof decodedPayload.name === "string" ? decodedPayload.name : undefined,
      picture:
        typeof decodedPayload.picture === "string"
          ? decodedPayload.picture
          : undefined,
    };
  } catch (error) {
    console.debug("[auth] Failed to decode Google credential:", error);
    return null;
  }
};

const findStoredUser = (): AuthUser | null => {
  if (typeof window === "undefined") return null;

  const storedId =
    localStorage.getItem(AUTH_STORAGE_KEY) ||
    sessionStorage.getItem(AUTH_STORAGE_KEY);

  if (!storedId) return null;

  const authUser = mockUsers.find((user) => user.id === storedId && user.is_active);
  if (authUser) return authUser;

  const systemUser = getSystemUsers().find(
    (user) =>
      user.id === storedId && user.is_active !== false && user.active !== false,
  );

  if (systemUser) {
    console.debug("[auth] Stored auth user matched by id:", {
      storedId,
      matchedUser: systemUser,
      loadedRole: normalizeRole(systemUser.role || systemUser.roleId),
    });
    return mapSystemUserToAuthUser(systemUser);
  }

  const savedUser = getSavedUserById(storedId);
  const savedEmail = normalizeEmail(savedUser?.email);
  const repairedSystemUser = savedEmail
    ? getSystemUsers().find(
        (user) =>
          normalizeEmail(user.email) === savedEmail &&
          user.is_active !== false &&
          user.active !== false,
      )
    : null;

  if (repairedSystemUser) {
    const repairedAuthUser = mapSystemUserToAuthUser(repairedSystemUser);
    persistUser(repairedAuthUser, Boolean(localStorage.getItem(AUTH_STORAGE_KEY)));
    return repairedAuthUser;
  }

  console.debug("[auth] Stored auth user could not be matched:", {
    storedId,
    savedUser,
  });
  return null;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(
    findStoredUser,
  );

  const login = useCallback(
    async (email: string, password: string, remember: boolean) => {
      const normalizedEmail = normalizeEmail(email);
      const user = mockUsers.find(
        (item) => normalizeEmail(item.email) === normalizedEmail,
      );

      if (!user || password !== MOCK_PASSWORD) {
        console.debug("[auth] Email/password login failed:", normalizedEmail);
        return {
          success: false,
          error: "Neteisingas el. pastas arba slaptazodis.",
        };
      }

      if (!user.is_active) {
        console.debug("[auth] Email/password login blocked inactive user:", user.id);
        return {
          success: false,
          error: "Vartotojas neaktyvus. Kreipkites i administratoriu.",
        };
      }

      persistUser(user, remember);
      setCurrentUser(user);
      console.debug("[auth] Email/password login success:", user.id);

      return { success: true };
    },
    [],
  );

  const loginWithGoogleCredential = useCallback(
    async (credential: string, remember: boolean) => {
      const profile = decodeGoogleProfile(credential);

      if (!profile?.email) {
        console.debug("[auth] Google login failed: credential email missing");
        return {
          success: false,
          error: "Nepavyko nuskaityti Google paskyros duomenu.",
        };
      }

      const normalizedEmail = normalizeEmail(profile.email);
      const domainAllowed = isAllowedGoogleDomain(normalizedEmail);
      console.debug("[auth] Google email:", profile.email);
      console.debug("[auth] Normalized Google email:", normalizedEmail);
      console.debug("[auth] Google domain validation:", {
        domain: getEmailDomain(normalizedEmail),
        allowed: domainAllowed,
        allowedDomains: ALLOWED_GOOGLE_DOMAINS,
      });

      const internalUsers = getSystemUsers();
      let systemUser = internalUsers.find(
        (item) => normalizeEmail(item.email) === normalizedEmail,
      );

      if (!systemUser) {
        console.debug("[auth] Found user:", null);
        if (domainAllowed) {
          systemUser = saveAutoApprovedGoogleUser(profile, normalizedEmail) ?? undefined;
        }

        if (systemUser) {
          console.debug("[auth] Created user object:", systemUser);
          console.debug("[auth] Assigned role:", normalizeRole(systemUser.role || systemUser.roleId));
          console.debug(
            "[auth] Assigned permissions:",
            mapSystemUserToAuthUser(systemUser, profile).modulePermissions,
          );
        }
      }

      if (!systemUser) {
        console.debug("[auth] Access decision:", {
          allowed: false,
          reason: domainAllowed
            ? "Google user could not be created in System Administration users"
            : "Google email domain is not allowed",
          googleEmail: profile.email,
          normalizedGoogleEmail: normalizedEmail,
          checkedEmails: internalUsers.map((user) => normalizeEmail(user.email)),
          domainAllowed,
        });
        return {
          success: false,
          error: "Si Google paskyra neturi prieigos prie intraneto.",
        };
      }

      console.debug("[auth] Found user:", systemUser);
      console.debug("[auth] Matched system user:", systemUser.id);
      console.debug("[auth] Role result:", normalizeRole(systemUser.role || systemUser.roleId));

      if (systemUser.is_active === false || systemUser.active === false) {
        if (domainAllowed && systemUser.id.startsWith("pending-")) {
          const approvedUser = saveAutoApprovedGoogleUser(profile, normalizedEmail);
          if (approvedUser) {
            systemUser = approvedUser;
            console.debug("[auth] Pending Google user auto-approved:", {
              userId: systemUser.id,
              role: normalizeRole(systemUser.role || systemUser.roleId),
              active: systemUser.is_active !== false && systemUser.active !== false,
            });
          }
        }
      }

      if (systemUser.is_active === false || systemUser.active === false) {
        console.debug("[auth] Google login blocked inactive user:", systemUser.id);
        console.debug("[auth] Access decision:", {
          allowed: false,
          reason: "Matched System Administration user is inactive",
          userId: systemUser.id,
          domainAllowed,
        });
        return {
          success: false,
          error: "Vartotojas neaktyvus. Kreipkites i administratoriu.",
        };
      }

      const user = mapSystemUserToAuthUser(systemUser, profile);
      console.debug("[auth] Permission load result:", user.modulePermissions);
      console.debug("[auth] Access decision:", {
        allowed: true,
        userId: user.id,
        role: user.role,
        permissions: user.modulePermissions,
      });

      persistUser(user, remember);
      setCurrentUser(user);
      console.debug("[auth] Auth result:", "success");
      console.debug("[auth] Google login success:", user.id);

      return { success: true };
    },
    [],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    setCurrentUser(null);
    console.debug("[auth] Logout complete");
  }, []);

  const value = useMemo(
    () => ({
      currentUser,
      isAuthenticated: Boolean(currentUser),
      login,
      loginWithGoogleCredential,
      logout,
    }),
    [currentUser, login, loginWithGoogleCredential, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
