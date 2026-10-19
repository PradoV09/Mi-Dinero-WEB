import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { buttonClassName } from "../components/ui";

export default function NotFound() {
  return (
    <div className="not-found">
      <span className="not-found__icon" aria-hidden="true">
        <Compass size={32} />
      </span>
      <p className="eyebrow">Error 404</p>
      <h1>No encontramos esta página</h1>
      <p>
        La dirección que abriste no existe o cambió. Puedes volver al inicio y
        continuar desde allí.
      </p>
      <Link to="/" className={buttonClassName({ size: "lg" })}>
        Volver al inicio
      </Link>
    </div>
  );
}
