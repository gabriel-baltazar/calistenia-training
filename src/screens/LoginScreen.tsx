import { useState, type FormEvent } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { CircleAlert } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { AuthError } from '../auth/types';
import { EMAIL_RE } from '../config/env';
import { HeroBackground } from '../components/three/HeroBackground';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Tooltip } from '../components/ui/Tooltip';
import s from './LoginScreen.module.css';

const GOOGLE_LOCAL_HELP = 'Login com Google indisponível no modo local. Configure o Firebase (veja o README).';
const GENERIC_ERROR = 'Não foi possível entrar. Tente novamente.';

interface FieldErrors {
  identifier?: string;
  password?: string;
}

/** Validação do formulário (§6.2), antes de chamar o serviço. A senha não passa por trim. */
function validate(identifier: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  const id = identifier.trim();
  if (id.length === 0) errors.identifier = 'Informe seu usuário ou e-mail.';
  else if (id.includes('@') && (id.length > 254 || !EMAIL_RE.test(id))) errors.identifier = 'E-mail inválido.';
  else if (id.length > 254) errors.identifier = 'Informe seu usuário ou e-mail.';
  if (password.length === 0) errors.password = 'Informe sua senha.';
  else if (password.length > 128) errors.password = 'Senha muito longa.';
  return errors;
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

export function LoginScreen() {
  const { status, mode, initialError, pending, signIn, signInWithGoogle } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: unknown } | null)?.from;
  const target = typeof from === 'string' && from.startsWith('/') && from !== '/login' ? from : '/';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [banner, setBanner] = useState<string | null>(null);

  if (status === 'authenticated') return <Navigate to={target} replace />;

  const isLocal = mode === 'local';
  const initFailed = initialError?.code === 'init-failed';
  const busy = status === 'loading' || pending !== null || initFailed;
  const bannerText = banner ?? initialError?.message ?? null;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const errors = validate(identifier, password);
    setFieldErrors(errors);
    if (errors.identifier || errors.password) return;
    setBanner(null);
    try {
      await signIn(identifier, password);
    } catch (err) {
      setBanner(err instanceof AuthError ? err.message : GENERIC_ERROR);
      setPassword('');
    }
  }

  function onGoogle() {
    if (busy || isLocal) return;
    setBanner(null);
    // Sem await antes: o popup precisa abrir dentro do gesto do usuário (§6.5).
    signInWithGoogle().catch((err: unknown) => {
      if (err instanceof AuthError && err.code === 'popup-closed') return;
      setBanner(err instanceof AuthError ? err.message : GENERIC_ERROR);
    });
  }

  const googleButton = (
    <Button
      variant="secondary"
      size="lg"
      fullWidth
      leftIcon={<GoogleMark />}
      onClick={onGoogle}
      disabled={busy || isLocal}
      loading={pending === 'google'}
    >
      Entrar com Google
    </Button>
  );

  return (
    <div className={s.screen}>
      <div className={s.hero}>
        <HeroBackground variant="login" />
        <div className={s.heroContent}>
          <span className={s.logo} aria-hidden="true">
            ⚔️
          </span>
          <p className={s.overline}>Floripa Style</p>
          <h1 className={s.title}>Treine como um espartano.</h1>
          <p className={s.subtitle}>Protocolo de 28 dias de calistenia, do básico ao Spartan Peak.</p>
          {isLocal && (
            <Badge tone="primary" className={s.badge}>
              Modo local
            </Badge>
          )}
        </div>
      </div>

      <div className={s.cardWrap}>
        <GlassCard strong padding="lg" className={s.card}>
          <h2 className={s.cardTitle}>Entrar</h2>
          <form className={s.form} onSubmit={onSubmit} noValidate>
            <Input
              label="Usuário ou e-mail"
              name="username"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              inputMode="email"
              hint="Use seu e-mail ou nome de usuário."
              value={identifier}
              error={fieldErrors.identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                if (fieldErrors.identifier) setFieldErrors((f) => ({ ...f, identifier: undefined }));
              }}
            />
            <Input
              label="Senha"
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              error={fieldErrors.password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) setFieldErrors((f) => ({ ...f, password: undefined }));
              }}
            />
            {bannerText && (
              <div className={s.banner} role="alert">
                <CircleAlert size={18} aria-hidden="true" className={s.bannerIcon} />
                <span>{bannerText}</span>
              </div>
            )}
            <Button type="submit" size="lg" fullWidth disabled={busy} loading={pending === 'password'}>
              Entrar
            </Button>
          </form>

          <div className={s.divider} aria-hidden="true">
            <span>ou</span>
          </div>

          {isLocal ? (
            <>
              <Tooltip content={GOOGLE_LOCAL_HELP} className={s.tooltip}>
                {googleButton}
              </Tooltip>
              <p className={s.help}>{GOOGLE_LOCAL_HELP}</p>
            </>
          ) : (
            googleButton
          )}

          {isLocal && <p className={s.footer}>Modo local: o acesso é verificado apenas neste navegador.</p>}
        </GlassCard>
      </div>
    </div>
  );
}
