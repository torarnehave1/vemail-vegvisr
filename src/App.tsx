import { useEffect, useMemo, useState } from 'react';
import { AuthBar, EcosystemNav, LanguageSelector } from 'vegvisr-ui-kit';
import appLogo from './assets/app-logo.png';
import { LanguageContext } from './lib/LanguageContext';
import { readStoredUser, type AuthUser } from './lib/auth';
import { getStoredLanguage, setStoredLanguage } from './lib/storage';
import { useTranslation } from './lib/useTranslation';
import { SidebarLayout } from './components/catalyst/sidebar-layout';
import { Navbar, NavbarSection, NavbarSpacer } from './components/catalyst/navbar';
import { EmailSidebar } from './components/EmailSidebar';
import { EmailList } from './components/EmailList';
import { EmailView } from './components/EmailView';
import { emails as allEmails, folders } from './data/mockEmails';

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

  const filteredEmails = useMemo(() => {
    if (activeFolder === 'starred') {
      return allEmails.filter((e) => e.starred);
    }
    return allEmails.filter((e) => e.folder === activeFolder);
  }, [activeFolder]);

  const selectedEmail = useMemo(
    () => allEmails.find((e) => e.id === selectedEmailId) ?? null,
    [selectedEmailId]
  );

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

  // Unauthenticated view
  if (authStatus !== 'authed') {
    return (
      <LanguageContext.Provider value={contextValue}>
        <div className="flex min-h-svh flex-col bg-white dark:bg-zinc-900">
          <header className="flex items-center justify-between border-b border-zinc-950/10 px-4 py-2 dark:border-white/10">
            <div className="flex items-center gap-3">
              <img src={appLogo} alt={t('app.title')} className="h-8 w-auto" />
              <EcosystemNav />
            </div>
            <div className="flex items-center gap-3">
              <LanguageSelector value={language} onChange={setLanguage} />
              <AuthBar
                userEmail={undefined}
                badgeLabel={t('app.badge')}
                signInLabel="Sign in"
                onSignIn={() => setLoginOpen((prev) => !prev)}
                logoutLabel="Log out"
                onLogout={handleLogout}
              />
            </div>
          </header>

          <div className="flex flex-1 flex-col items-center justify-center px-6">
            {authStatus === 'checking' && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Checking session...</p>
            )}

            {authStatus === 'anonymous' && !loginOpen && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Sign in to access your email.
              </p>
            )}

            {authStatus === 'anonymous' && loginOpen && (
              <div className="w-full max-w-sm rounded-xl border border-zinc-950/10 p-6 dark:border-white/10">
                <div className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                  Magic Link Sign In
                </div>
                <div className="mt-4 flex flex-col gap-3">
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(event) => setLoginEmail(event.target.value)}
                    placeholder="you@email.com"
                    className="rounded-lg border border-zinc-950/10 bg-transparent px-4 py-2 text-sm text-zinc-950 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-white/10 dark:text-white dark:placeholder:text-zinc-400"
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
                {loginStatus && <p className="mt-3 text-xs text-emerald-600 dark:text-emerald-400">{loginStatus}</p>}
                {loginError && <p className="mt-3 text-xs text-rose-600 dark:text-rose-400">{loginError}</p>}
                <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">
                  We will send a secure link that logs you into this app.
                </p>
              </div>
            )}
          </div>
        </div>
      </LanguageContext.Provider>
    );
  }

  // Authenticated email client with Catalyst SidebarLayout
  return (
    <LanguageContext.Provider value={contextValue}>
      <SidebarLayout
        navbar={
          <Navbar>
            <NavbarSection>
              <img src={appLogo} alt={t('app.title')} className="h-6 w-auto" />
            </NavbarSection>
            <NavbarSpacer />
            <NavbarSection>
              <EcosystemNav />
              <LanguageSelector value={language} onChange={setLanguage} />
              <AuthBar
                userEmail={authUser?.email}
                badgeLabel={t('app.badge')}
                signInLabel="Sign in"
                onSignIn={() => setLoginOpen((prev) => !prev)}
                logoutLabel="Log out"
                onLogout={handleLogout}
              />
            </NavbarSection>
          </Navbar>
        }
        sidebar={
          <EmailSidebar
            folders={folders}
            activeFolder={activeFolder}
            onFolderChange={handleFolderChange}
            user={authUser}
          />
        }
      >
        {/* Two-panel email content area */}
        <div className="-m-6 flex h-[calc(100vh-theme(spacing.4))] lg:-m-10 lg:h-[calc(100vh-theme(spacing.4))]">
          {/* Email list */}
          <div className="w-80 shrink-0 border-r border-zinc-950/5 dark:border-white/5">
            <EmailList
              emails={filteredEmails}
              selectedId={selectedEmailId}
              onSelect={setSelectedEmailId}
            />
          </div>

          {/* Email content */}
          <div className="min-w-0 flex-1">
            <EmailView email={selectedEmail} />
          </div>
        </div>
      </SidebarLayout>
    </LanguageContext.Provider>
  );
}

export default App
