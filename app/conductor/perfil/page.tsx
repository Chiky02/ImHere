import { redirect } from "next/navigation";

/** Compatibilidad: el perfil del conductor vive en /cuenta */
export default function PerfilRedirect() {
  redirect("/cuenta");
}
