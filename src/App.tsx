import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { AuthBar, EcosystemNav, LanguageSelector } from 'vegvisr-ui-kit';
import appLogo from './assets/app-logo.png';
import { LanguageContext } from './lib/LanguageContext';
import { readStoredUser, type AuthUser } from './lib/auth';
import { sendEmail, getAccounts, loadAccountsFromCloud, type EmailAccount } from './lib/emailAccounts';
import { fetchEmails, fetchEmail, toEmail } from './lib/emailStore';
import { getStoredLanguage, setStoredLanguage } from './lib/storage';
import { useTranslation } from './lib/useTranslation';
import { EmailSidebar } from './components/EmailSidebar';
import { EmailList } from './components/EmailList';
import { EmailView } from './components/EmailView';
import { folders, type Email } from './data/mockEmails';

const ComposeView = lazy(() =>
  import('./components/ComposeView').then((m) => ({ default: m.ComposeView }))
);
const EmailSettings = lazy(() =>
  import('./components/EmailSettings').then((m) => ({ default: m.EmailSettings }))
);

const MAGIC_BASE = 'https://cookie.vegvisr.org';
const DASHBOARD_BASE = 'https://dashboard.vegvisr.org';

function App() {
  const [language, setLanguageState] = useState(getStoredLanguage());
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authStatus, setAuthStatus] = useState<'checking' | 'authed' | 'anonymous'>('checking');
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginStatus, setLoginStatus] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [activeFolder, setActiveFolder] = useState('inbox');
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'email' | 'compose' | 'settings'>('email');
  const [sendStatus, setSendStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [emails, setEmails] = useState<Email[]>([]);
  const [emailsLoading, setEmailsLoading] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [activeAccount, setActiveAccount] = useState<EmailAccount | null>(null);

  // Load email accounts when user authenticates
  useEffect(() => {
    if (!authUser?.email) {
      setActiveAccount(null);
      return;
    }
    // Try local first, then cloud
    const local = getAccounts();
    if (local.length > 0) {
      setActiveAccount(local.find((a) => a.isDefault) || local[0]);
      return;
    }
    loadAccountsFromCloud(authUser.email).then((cloud) => {
      if (cloud && cloud.length > 0) {
        setActiveAccount(cloud.find((a) => a.isDefault) || cloud[0]);
      }
    });
  }, [authUser?.email]);

  // The email address and store URL to use for fetching
  const mailboxEmail = activeAccount?.email || authUser?.email || '';
  const mailboxStoreUrl = activeAccount?.storeUrl || undefined;

  // Fetch emails from store-worker when folder or user changes
  useEffect(() => {
    if (!mailboxEmail) return;
    let cancelled = false;
    setEmailsLoading(true);
    setEmails([]);
    fetchEmails(mailboxEmail, activeFolder, 50, 0, mailboxStoreUrl).then((stored) => {
      if (!cancelled) {
        setEmails(stored.map((s) => toEmail(s)));
        setEmailsLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [mailboxEmail, mailboxStoreUrl, activeFolder]);

  // Fetch full email (with HTML body from R2) when selection changes
  useEffect(() => {
    if (!selectedEmailId || !mailboxEmail) {
      setSelectedEmail(null);
      return;
    }
    let cancelled = false;
    fetchEmail(mailboxEmail, selectedEmailId, mailboxStoreUrl).then((result) => {
      if (!cancelled && result) {
        setSelectedEmail(toEmail(result.email, result.bodyHtml, result.bodyText));
      } else if (!cancelled) {
        setSelectedEmail(null);
      }
    });
    return () => { cancelled = true; };
  }, [mailboxEmail, mailboxStoreUrl, selectedEmailId]);

  const setLanguage = (value: typeof language) => {
    setLanguageState(value);
    setStoredLanguage(value);
  };

  const contextValue = useMemo(
    () => ({ language, setLanguage }),
    [language]
  );
  const t = useTranslation(language);

  const setAuthCookie = (token: string) => {
    if (!token) return;
    const isVegvisr = window.location.hostname.endsWith('vegvisr.org');
    const domain = isVegvisr ? '; Domain=.vegvisr.org' : '';
    const maxAge = 60 * 60 * 24 * 30;
    document.cookie = `vegvisr_token=${encodeURIComponent(
      token
    )}; Path=/; Max-Age=${maxAge}; SameSite=Lax; Secure${domain}`;
  };

  const persistUser = (user: {
    email: string;
    role: string;
    user_id: string | null;
    emailVerificationToken: string | null;
    oauth_id?: string | null;
    phone?: string | null;
    phoneVerifiedAt?: string | null;
    branding?: { mySite: string | null; myLogo: string | null };
    profileimage?: string | null;
  }) => {
    const payload = {
      email: user.email,
      role: user.role,
      user_id: user.user_id,
      oauth_id: user.oauth_id || user.user_id || null,
      emailVerificationToken: user.emailVerificationToken,
      phone: user.phone || null,
      phoneVerifiedAt: user.phoneVerifiedAt || null,
      branding: user.branding || { mySite: null, myLogo: null },
      profileimage: user.profileimage || null
    };
    localStorage.setItem('user', JSON.stringify(payload));
    if (user.emailVerificationToken) {
      setAuthCookie(user.emailVerificationToken);
    }
    sessionStorage.setItem('email_session_verified', '1');
    setAuthUser({
      userId: payload.user_id || payload.oauth_id || '',
      email: payload.email,
      role: payload.role || null
    });
  };

  const fetchUserContext = async (targetEmail: string) => {
    const roleRes = await fetch(
      `${DASHBOARD_BASE}/get-role?email=${encodeURIComponent(targetEmail)}`
    );
    if (!roleRes.ok) {
      throw new Error(`User role unavailable (status: ${roleRes.status})`);
    }
    const roleData = await roleRes.json();
    if (!roleData?.role) {
      throw new Error('Unable to retrieve user role.');
    }

    const userDataRes = await fetch(
      `${DASHBOARD_BASE}/userdata?email=${encodeURIComponent(targetEmail)}`
    );
    if (!userDataRes.ok) {
      throw new Error(`Unable to fetch user data (status: ${userDataRes.status})`);
    }
    const userData = await userDataRes.json();
    return {
      email: targetEmail,
      role: roleData.role,
      user_id: userData.user_id,
      emailVerificationToken: userData.emailVerificationToken,
      oauth_id: userData.oauth_id,
      phone: userData.phone,
      phoneVerifiedAt: userData.phoneVerifiedAt,
      branding: userData.branding,
      profileimage: userData.profileimage
    };
  };

  const verifyMagicToken = async (token: string) => {
    const res = await fetch(
      `${MAGIC_BASE}/login/magic/verify?token=${encodeURIComponent(token)}`,
      { method: 'GET', headers: { 'Content-Type': 'application/json' } }
    );
    const data = await res.json();
    if (!res.ok || !data.success || !data.email) {
      throw new Error(data.error || 'Invalid or expired magic link.');
    }
    try {
      const userContext = await fetchUserContext(data.email);
      persistUser(userContext);
    } catch {
      persistUser({
        email: data.email,
        role: 'user',
        user_id: data.email,
        emailVerificationToken: null
      });
    }
  };

  const sendMagicLink = async () => {
    if (!loginEmail.trim()) return;
    setLoginError('');
    setLoginStatus('');
    setLoginLoading(true);
    try {
      const redirectUrl = `${window.location.origin}${window.location.pathname}`;
      const res = await fetch(`${MAGIC_BASE}/login/magic/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail.trim(), redirectUrl })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to send magic link.');
      }
      setLoginStatus('Magic link sent. Check your email.');
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Failed to send magic link.');
    } finally {
      setLoginLoading(false);
    }
  };

  const clearAuthCookie = () => {
    const base = 'vegvisr_token=; Path=/; Max-Age=0; SameSite=Lax; Secure';
    const hostname = window.location.hostname;
    document.cookie = base;
    if (hostname.endsWith('vegvisr.org')) {
      document.cookie = `${base}; Domain=.vegvisr.org`;
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('user');
      sessionStorage.removeItem('email_session_verified');
    } catch {
      // ignore storage errors
    }
    clearAuthCookie();
    setAuthUser(null);
    setAuthStatus('anonymous');
  };

  useEffect(() => {
    const url = new URL(window.location.href);
    const magic = url.searchParams.get('magic');
    if (!magic) return;
    setAuthStatus('checking');
    verifyMagicToken(magic)
      .then(() => {
        url.searchParams.delete('magic');
        window.history.replaceState({}, '', url.toString());
        setAuthStatus('authed');
      })
      .catch(() => {
        setAuthStatus('anonymous');
      });
  }, []);

  useEffect(() => {
    let isMounted = true;
    const bootstrap = async () => {
      const stored = readStoredUser();
      if (stored && isMounted) {
        setAuthUser(stored);
        setAuthStatus('authed');
        return;
      }
      if (isMounted) {
        setAuthStatus('anonymous');
      }
    };
    bootstrap();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleFolderChange = (key: string) => {
    setActiveFolder(key);
    setSelectedEmailId(null);
  };

  // Shared dark header for vegvisr-ui-kit components
  const appHeader = (
    <header className="flex shrink-0 items-center justify-between bg-zinc-900 px-4 py-2">
      <div className="flex items-center gap-3">
        <img src={appLogo} alt={t('app.title')} className="h-8 w-auto" />
        <EcosystemNav />
      </div>
      <div className="flex items-center gap-3">
        <LanguageSelector value={language} onChange={setLanguage} />
        <AuthBar
          userEmail={authStatus === 'authed' ? authUser?.email : undefined}
          badgeLabel={t('app.badge')}
          signInLabel="Sign in"
          onSignIn={() => setLoginOpen((prev) => !prev)}
          logoutLabel="Log out"
          onLogout={handleLogout}
        />
      </div>
    </header>
  );

  // Unauthenticated view
  if (authStatus !== 'authed') {
    return (
      <LanguageContext.Provider value={contextValue}>
        <div className="flex h-screen flex-col">
          {appHeader}

          <div className="flex flex-1 flex-col items-center justify-center bg-zinc-100 px-6">
            {authStatus === 'checking' && (
              <p className="text-sm text-zinc-500">Checking session...</p>
            )}

            {authStatus === 'anonymous' && !loginOpen && (
              <p className="text-sm text-zinc-500">
                Sign in to access your email.
              </p>
            )}

            {authStatus === 'anonymous' && loginOpen && (
              <div className="w-full max-w-sm rounded-xl border border-zinc-950/10 bg-white p-6 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                  Magic Link Sign In
                </div>
                <div className="mt-4 flex flex-col gap-3">
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(event) => setLoginEmail(event.target.value)}
                    placeholder="you@email.com"
                    className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={sendMagicLink}
                    disabled={loginLoading}
                    className="rounded-lg bg-sky-500 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-600 disabled:opacity-50"
                  >
                    {loginLoading ? 'Sending...' : 'Send link'}
                  </button>
                </div>
                {loginStatus && <p className="mt-3 text-xs text-emerald-600">{loginStatus}</p>}
                {loginError && <p className="mt-3 text-xs text-rose-600">{loginError}</p>}
                <p className="mt-3 text-xs text-zinc-400">
                  We will send a secure link that logs you into this app.
                </p>
              </div>
            )}
          </div>
        </div>
      </LanguageContext.Provider>
    );
  }

  // Authenticated: dark header + three-panel email client
  return (
    <LanguageContext.Provider value={contextValue}>
      <div className="flex h-screen flex-col">
        {appHeader}

        {/* Three-panel layout: sidebar | email list | email content */}
        <div className="flex min-h-0 flex-1">
          {/* Folder sidebar */}
          <div className="w-64 shrink-0 border-r border-zinc-950/5 bg-white">
            <EmailSidebar
              folders={folders}
              activeFolder={activeFolder}
              onFolderChange={(key) => { handleFolderChange(key); setActiveView('email'); }}
              onCompose={() => { setActiveView('compose'); setSelectedEmailId(null); }}
              onSettings={() => setActiveView('settings')}
              settingsActive={activeView === 'settings'}
              user={authUser}
            />
          </div>

          {/* Email list */}
          <div className="w-80 shrink-0 border-r border-zinc-950/5 bg-white">
            <EmailList
              emails={emails}
              selectedId={selectedEmailId}
              onSelect={(id) => { setSelectedEmailId(id); setActiveView('email'); }}
              loading={emailsLoading}
            />
          </div>

          {/* Email content / Compose / Settings */}
          <div className="min-w-0 flex-1 bg-zinc-50">
            {activeView === 'compose' && (
              <Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-zinc-400">Loading editor...</div>}>
                <ComposeView
                  userEmail={authUser?.email ?? null}
                  onClose={() => setActiveView('email')}
                  onSend={async (email) => {
                    if (!authUser?.email) return;
                    setSendStatus(null);
                    const result = await sendEmail(authUser.email, {
                      accountId: email.fromAccountId,
                      to: email.to,
                      subject: email.subject,
                      html: email.bodyHtml,
                    });
                    if (result.success) {
                      setSendStatus({ type: 'success', message: 'Email sent!' });
                      setActiveView('email');
                      setTimeout(() => setSendStatus(null), 4000);
                    } else {
                      setSendStatus({ type: 'error', message: result.error || 'Failed to send' });
                      setTimeout(() => setSendStatus(null), 6000);
                    }
                  }}
                />
              </Suspense>
            )}
            {activeView === 'settings' && (
              <Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-zinc-400">Loading settings...</div>}>
                <EmailSettings
                  userEmail={authUser?.email ?? null}
                  onClose={() => setActiveView('email')}
                />
              </Suspense>
            )}
            {activeView === 'email' && (
              <EmailView email={selectedEmail} />
            )}
          </div>
        </div>

        {/* Send status toast */}
        {sendStatus && (
          <div
            className={`fixed bottom-4 right-4 z-50 rounded-lg px-4 py-2 text-sm font-medium shadow-lg ${
              sendStatus.type === 'success'
                ? 'bg-emerald-600 text-white'
                : 'bg-rose-600 text-white'
            }`}
          >
            {sendStatus.message}
          </div>
        )}
      </div>
    </LanguageContext.Provider>
  );
}

export default App
