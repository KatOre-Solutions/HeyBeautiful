# Account & provider management — design notes

**Status: not implemented. This is the plan, not a description of the code.**

Written during the Phase 10 auth review. Nothing in `/account` manages sign-in methods today;
this records how it should be built when someone picks it up, and what the auth layer already
does and doesn't give you.

---

## Where things actually stand

`/account` is a dashboard of **stub cards** (`{/* Stub cards */}` in `AccountContent.tsx`) —
My Orders, Wishlist, Profile Settings, Loyalty Points. They have `cursor-pointer` and a hover
lift, but no click handler and no route behind them. There is no settings page, no profile
editing, and no notion of connected providers anywhere in the app.

So there is no "Account Settings architecture" to extend. The question this phase actually
answers is narrower: **does the auth layer obstruct building one?** It does not. What follows
is what to build and the traps to avoid.

### What already exists in your favour

| Thing | Where | Why it matters here |
| --- | --- | --- |
| Single Firebase boundary | `src/context/AuthContext.tsx` | Every Firebase call already lives in one file. Linking methods slot in beside `signIn`/`signUp` with no restructuring. |
| Central error mapping | `src/lib/auth-errors.ts` | Duck-typed, no `instanceof`, no SDK import. The four linking codes are already mapped (no callers yet). |
| `auth/requires-recent-login` mapped | `src/lib/auth-errors.ts` | The prerequisite for every sensitive operation below, already worded for users. |
| Popup → redirect fallback | `socialSignIn` in `AuthContext` | `linkWithPopup`/`linkWithRedirect` need exactly the same shape. Copy the pattern, don't reinvent it. |
| Pending credential preserved | `socialSignIn` catch block | On `auth/account-exists-with-different-credential` the error propagates intact, so the credential is still recoverable. There is a comment marking the spot. |
| Shared provider instances | `src/lib/firebase.ts` | `googleProvider` / `appleProvider` are exported singletons with scopes configured. Reuse them for linking and reauth. |

Nothing needs undoing first.

---

## Firebase APIs required

All from `firebase/auth`.

**Reading state**

- `user.providerData` — array of `UserInfo`. The `providerId` values you'll see are
  `"google.com"`, `"apple.com"`, `"password"`. This is the source of truth for "what is
  connected"; derive it, don't mirror it into state.

**Linking**

- `linkWithPopup(user, provider)` → `UserCredential`
- `linkWithRedirect(user, provider)` — the fallback when the popup is blocked
- `linkWithCredential(user, credential)` — for a credential recovered from a conflict
- `GoogleAuthProvider.credentialFromError(err)` / `OAuthProvider.credentialFromError(err)` —
  recovers the pending credential from `auth/account-exists-with-different-credential`

**Unlinking**

- `unlink(user, providerId)` → `User`

**Reauthentication**

- `reauthenticateWithPopup(user, provider)` — social
- `reauthenticateWithCredential(user, credential)` — password, built with
  `EmailAuthProvider.credential(email, password)`

**Adjacent operations that will land in the same settings screen**

- `updatePassword(user, next)`
- `verifyBeforeUpdateEmail(user, next)` — prefer this over `updateEmail`; it verifies the new
  address before switching, rather than after
- `deleteUser(user)`

**Deliberately not used**

- `fetchSignInMethodsForEmail` — the account-enumeration surface Phase 7 closed. It also
  returns nothing useful once Firebase's email-enumeration protection is on. Never reintroduce
  it to answer "which providers does this email have?" for a *not-yet-signed-in* user.

---

## Recent login

Firebase invalidates sensitive operations when the sign-in is not recent (roughly five
minutes). Treat `auth/requires-recent-login` as **expected control flow, not an error** for:

- `deleteUser`
- `updatePassword`
- `verifyBeforeUpdateEmail`
- `unlink` and `linkWithCredential` (these *can* throw it; don't assume they won't)

### Recommended shape: reauthenticate on demand

Do not gate the settings screen behind a pre-emptive password prompt. Attempt the operation,
catch the code, prompt, retry:

```
attempt operation
  └─ auth/requires-recent-login
       ├─ user has "password" in providerData → inline password prompt
       │                                        → reauthenticateWithCredential
       └─ social-only account                 → reauthenticateWithPopup(existing provider)
                                                (popup blocked → reauthenticateWithRedirect)
  └─ retry the original operation once
```

Most users never see the prompt, and nobody is asked for a password before they've decided to
do anything.

**Redirect-based reauth loses in-progress form state.** If the settings screen has unsaved
input, persist it before calling the redirect variant — the same problem `saveDestination`
solves for sign-in, and worth reusing that pattern rather than inventing another.

---

## The safety rule that matters most

> A user must never be able to remove their last remaining way in.

Firebase **does not enforce this.** `unlink` will happily strip the final provider and leave an
account nobody can authenticate against. Recovery then needs Admin SDK intervention.

Enforce it client-side, in a pure function so it can be tested without a browser:

```ts
// src/lib/providers.ts
export function canUnlink(providerIds: string[], target: string): boolean {
  return providerIds.includes(target) && providerIds.length > 1;
}
```

Then disable the control *and* explain why, rather than failing on click. The UI should say
something like "Add another sign-in method before removing this one."

One subtlety: a `"password"` provider is only a real way back in if the user knows the
password. Someone who signed up with Google and later got a password credential via the reset
flow (see Phase 7 — a reset on a federated account *creates* a password credential) may not
realise they have one. Count it as a method, but don't treat it as a reason to be relaxed about
the last-provider rule.

---

## Edge cases

| Case | What happens | What to do |
| --- | --- | --- |
| Unlinking the last provider | Account becomes unreachable; Firebase allows it | Block in UI via `canUnlink`; never rely on the SDK |
| `auth/credential-already-in-use` | The Google/Apple account is already on a *different* Hey Beautiful account | Explain plainly. **Firebase has no built-in account merge** — merging means a server-side migration of orders/wishlist and re-keying, which is a project of its own. Do not attempt it client-side. |
| `auth/provider-already-linked` | Already connected | Shouldn't be reachable if the UI derives from `providerData`; handle anyway |
| Apple re-linking | Apple releases the user's name **only on first authorization**. Unlink → relink returns no name. | Never overwrite a stored `displayName` with an empty value on relink. `captureProviderDisplayName` in `AuthContext` already guards the capture side. |
| Social-only account, "change password" | There is no password to change | Offer "set a password" (send a reset link) instead of a change-password form. Decide from `providerData`, not by attempting and failing. |
| Linking a verified Google account to an unverified password account | `emailVerified` may or may not flip | Re-read `user.emailVerified` after linking rather than assuming; `reloadUser()` already exists for this |
| Provider email ≠ account email | Linking Google with a different address doesn't change the primary email | Show which address each connected method carries, so the list isn't confusing |
| Popup blocked during link or reauth | Same failure as sign-in | Reuse `isPopupFallbackError` from `src/lib/auth-errors.ts` |
| Unlinking mid-session | `providerData` changes but the session stays valid | Re-derive from `user.providerData`; don't cache a snapshot |

---

## Recommended implementation order

1. **`src/lib/providers.ts`** — pure helpers: `canUnlink`, a `providerId → label` map, and a
   `describeProviders(user)` derivation. Testable with no browser.
2. **`AuthContext`** — add `linkProvider`, `unlinkProvider`, `reauthenticate`. Keep the
   popup→redirect fallback identical to `socialSignIn`. Expose `providers` as a *derived*
   value from `user.providerData`, not new state.
3. **`/account/settings`** — a real route following the project's server-page +
   `*Content.tsx` client-component pattern. Add it to `PROTECTED` in `src/proxy.ts`.
4. **Reauthentication prompt** — the on-demand flow above.
5. **Conflict-driven linking** — only then wire the `auth/account-exists-with-different-credential`
   path at sign-in to offer "connect these accounts", using the preserved pending credential.

Steps 1–3 are low risk. Step 5 is the one with real teeth and should not be attempted until
1–4 are solid.

---

## Why none of this was built now

Every item needs a settings screen that doesn't exist, and step 5 needs a reauthentication
story that doesn't exist either. Building linking against stub cards would mean shipping a
security-sensitive flow with no home, no tests, and no way to verify it — the auth work so far
has been verifiable at every step, and this would have been the first part that wasn't.

The auth layer is ready for it. Nothing above requires changing code that already ships.
