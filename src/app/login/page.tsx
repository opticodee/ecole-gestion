import type { Metadata } from 'next';
import type { ComponentType, SVGProps } from 'react';
import { GraduationCap, Shield, Users } from 'lucide-react';
import { LoginForm } from './login-form';

export const metadata: Metadata = {
  title: 'Connexion',
};

const GOLD = '#D4A843';
const GOLD_SOFT = '#C9A84C';

export default function LoginPage() {
  const year = new Date().getFullYear();

  return (
    <div className="flex h-screen flex-col overflow-hidden lg:flex-row">
      {/* Left: brand side */}
      <section
        className="relative hidden flex-col overflow-hidden p-8 text-white lg:flex lg:w-3/5 lg:p-10 xl:p-14"
        style={{
          background:
            'linear-gradient(140deg, hsl(155 40% 15%) 0%, hsl(155 55% 22%) 50%, hsl(155 60% 25%) 100%)',
        }}
      >
        {/* Dark-mode boost */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 hidden dark:block"
          style={{
            background:
              'linear-gradient(140deg, hsl(155 50% 8%) 0%, hsl(155 55% 14%) 50%, hsl(155 60% 18%) 100%)',
          }}
        />

        {/* Soft radial spotlight */}
        <span
          aria-hidden
          className="pointer-events-none absolute -left-40 top-1/2 h-[600px] w-[600px] -translate-y-1/2 rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 60%)',
          }}
        />

        {/* Very subtle dot texture */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* TOP — logo + brand */}
        <div className="relative z-10 flex items-center gap-4">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full border-2 bg-white/5 font-semibold tracking-wider backdrop-blur-sm"
            style={{ borderColor: 'rgba(255,255,255,0.9)' }}
          >
            <span className="text-xs">ACM</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight xl:text-4xl">
              ACMSCHOOL
            </h1>
            <p className="mt-0.5 text-sm font-medium tracking-wide text-white/70">
              École d&apos;enseignement arabe et coranique
            </p>
          </div>
        </div>

        {/* CENTER — big typography */}
        <div className="relative z-10 flex flex-1 flex-col justify-center">
          <h2 className="text-5xl font-bold leading-tight tracking-tight xl:text-6xl">
            Bienvenue sur
            <br />
            <span style={{ color: GOLD }}>votre espace scolaire.</span>
          </h2>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/60">
            Suivez la scolarité, consultez les résultats et restez connectés.
          </p>
        </div>

        {/* BOTTOM — feature cards */}
        <div className="relative z-10 grid grid-cols-3 gap-3">
          <FeatureCard
            icon={GraduationCap}
            title="Vie Scolaire"
            subtitle="Notes, bulletins et suivi des élèves"
          />
          <FeatureCard
            icon={Users}
            title="Espace dédié"
            subtitle="Parents, enseignants et administration"
          />
          <FeatureCard
            icon={Shield}
            title="Sécurisé"
            subtitle="Vos données protégées et confidentielles"
          />
        </div>

        {/* Footer */}
        <div
          className="relative z-10 mt-6 text-xs"
          style={{ color: `${GOLD_SOFT}99` }}
        >
          © {year} ACMSCHOOL
        </div>
      </section>

      {/* Right: form */}
      <section className="flex w-full flex-1 items-center justify-center overflow-y-auto bg-background px-4 py-10 sm:px-6 lg:w-2/5 lg:px-10">
        <div className="w-full max-w-sm space-y-8 animate-fade-in">
          {/* Mobile header */}
          <div className="space-y-3 text-center lg:hidden">
            <div
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 font-semibold tracking-wider"
              style={{ borderColor: GOLD, color: GOLD }}
            >
              ACM
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-primary">
              ACMSCHOOL
            </h1>
            <p className="text-sm text-muted-foreground">
              École d&apos;enseignement arabe et coranique
            </p>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-2xl font-semibold tracking-tight">Connexion</h2>
            <p className="text-sm text-muted-foreground">
              Connectez-vous avec votre adresse email.
            </p>
          </div>

          <LoginForm />

          <p className="text-center text-xs text-muted-foreground lg:hidden">
            © {year} ACMSCHOOL
          </p>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  subtitle: string;
}) {
  return (
    <div
      className="rounded-xl border bg-white/10 p-4 backdrop-blur-sm"
      style={{ borderColor: `${GOLD}4D` }}
    >
      <span
        className="flex h-10 w-10 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${GOLD}1F`, color: GOLD }}
      >
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-3 text-sm font-semibold text-white">{title}</p>
      <p className="mt-0.5 text-xs leading-snug text-white/70">{subtitle}</p>
    </div>
  );
}
