import { Wallet } from "lucide-react";
import { Card, EmptyState } from "../ui";
import type { Account } from "../../types/accounts";
import { CURRENCIES, formatMoney, type Currency } from "../../utils/money";

const CURRENCY_LABELS: Record<Currency, string> = {
  COP: "Pesos colombianos",
  USD: "Dólares estadounidenses",
  EUR: "Euros",
};

export function AccountBalances({ accounts }: { accounts: Account[] }) {
  if (accounts.length === 0) {
    return (
      <Card title="Saldos por cuenta">
        <EmptyState
          icon={<Wallet size={28} />}
          title="Todavía no tienes cuentas"
          description="Crea una cuenta para registrar movimientos y ver su saldo aquí."
        />
      </Card>
    );
  }

  return (
    <Card title="Saldos por cuenta">
      <p className="card__description">
        Datos registrados por ti. No son saldos bancarios reales.
      </p>
      <div className="balance-groups">
        {CURRENCIES.map((currency) => {
          const group = accounts.filter(
            (account) => account.currency === currency.value,
          );

          if (group.length === 0) {
            return null;
          }

          return (
            <section
              key={currency.value}
              className="balance-group"
              aria-labelledby={`balance-${currency.value}`}
            >
              <h3 className="balance-group__title" id={`balance-${currency.value}`}>
                {currency.value} · {CURRENCY_LABELS[currency.value]}
              </h3>
              <ul className="balance-list">
                {group.map((account) => (
                  <li key={account.id} className="balance-row">
                    <span className="balance-row__name">
                      {account.name}
                      {account.archived && (
                        <span className="badge">Archivada</span>
                      )}
                    </span>
                    <span className="balance-row__amount money">
                      {formatMoney(account.balance, account.currency)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </Card>
  );
}
