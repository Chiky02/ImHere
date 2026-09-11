import Link from "next/link";
import { loginAction } from "@/lib/actions";
import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-4 py-8 sm:py-10">
      <div className="card w-full max-w-md p-5 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-forest">
          Recorridos
        </p>
        <h1 className="display mt-1 text-3xl sm:text-4xl">Control de puntos</h1>
        <p className="mt-2 text-sm text-muted sm:text-base">
          Conductores avisan. El punto registra. El bus anterior se entera.
        </p>
        <div className="mt-6">
          <AuthForm
            action={loginAction}
            submitLabel="Entrar"
            extra={
              <>
                <div>
                  <label htmlFor="phone">Celular</label>
                  <input
                    id="phone"
                    name="phone"
                    inputMode="numeric"
                    autoComplete="username"
                    placeholder="Tu número"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="password">Contraseña</label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                  />
                </div>
              </>
            }
          />
        </div>
        <p className="mt-5 text-sm text-muted">
          ¿Conductor nuevo?{" "}
          <Link href="/registro" className="font-semibold text-forest">
            Crea tu perfil
          </Link>
        </p>
      </div>
    </div>
  );
}
