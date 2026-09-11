import Link from "next/link";
import { registerAction } from "@/lib/actions";
import { AuthForm } from "@/components/auth-form";

export default function RegistroPage() {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-4 py-8 sm:py-10">
      <div className="card w-full max-w-md p-5 sm:p-8">
        <h1 className="display text-3xl sm:text-4xl">Perfil de conductor</h1>
        <p className="mt-2 text-sm text-muted sm:text-base">
          Registra tu nombre y celular. El admin te asigna la buseta y aprueba el
          perfil antes de que puedas avisar.
        </p>
        <div className="mt-6">
          <AuthForm
            action={registerAction}
            submitLabel="Crear perfil"
            extra={
              <>
                <div>
                  <label htmlFor="name">Nombre</label>
                  <input id="name" name="name" required placeholder="Tu nombre" />
                </div>
                <div>
                  <label htmlFor="phone">Celular</label>
                  <input
                    id="phone"
                    name="phone"
                    inputMode="numeric"
                    required
                    placeholder="3XXXXXXXXX"
                  />
                </div>
                <div>
                  <label htmlFor="password">Contraseña</label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    minLength={6}
                    required
                  />
                </div>
              </>
            }
          />
        </div>
        <p className="mt-5 text-sm">
          <Link href="/login" className="font-semibold text-forest">
            Ya tengo cuenta
          </Link>
        </p>
      </div>
    </div>
  );
}
