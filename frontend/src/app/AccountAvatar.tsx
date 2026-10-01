import type { AccountState } from "./account";
import { UiIcon } from "./UiIcon";

export function AccountMark({ user }: { user: AccountState["user"] }) {
  if (user?.avatarUrl) return <img className="account-avatar" src={user.avatarUrl} alt="" referrerPolicy="no-referrer" />;
  if (user?.name || user?.email) {
    const label = String(user.name ?? user.email ?? "?").trim();
    return <span className="account-avatar account-avatar-fallback" aria-hidden="true">{Array.from(label)[0]?.toUpperCase() || "?"}</span>;
  }
  return <span className="account-avatar account-avatar-guest" aria-hidden="true"><UiIcon name="user" size={18} /></span>;
}
