import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, ReceiptText } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Modal,
  Skeleton,
  useToast,
} from "../../components/ui";
import { AccountBalances } from "../../components/transactions/AccountBalances";
import {
  TransactionFilters,
  type FilterValues,
} from "../../components/transactions/TransactionFilters";
import { TransactionForm } from "../../components/transactions/TransactionForm";
import { listAccounts } from "../../services/accounts";
import { listCategories } from "../../services/categories";
import {
  createTransaction,
  deleteTransaction,
  listTransactions,
  updateTransaction,
} from "../../services/transactions";
import type { Account } from "../../types/accounts";
import type { Paginated } from "../../types/api";
import type {
  Category,
  Transaction,
  TransactionInput,
  TransactionType,
} from "../../types/transactions";
import { formatDate } from "../../utils/date";
import { formatMoney } from "../../utils/money";

const PAGE_SIZE = 20;

interface PageFilters extends FilterValues {
  page: number;
}

function parseFilters(params: URLSearchParams): PageFilters {
  const page = Number(params.get("page"));
  const type = params.get("type");

  return {
    from: params.get("from") || undefined,
    to: params.get("to") || undefined,
    account_id: params.get("account_id") || undefined,
    category_id: params.get("category_id") || undefined,
    type:
      type === "income" || type === "expense"
        ? (type as TransactionType)
        : undefined,
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

function toSearchParams(values: FilterValues): URLSearchParams {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }

  return params;
}

export default function TransactionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const filtersKey = searchParams.toString();
  const filters = useMemo(
    () => parseFilters(new URLSearchParams(filtersKey)),
    [filtersKey],
  );

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [data, setData] = useState<Paginated<Transaction> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [formState, setFormState] = useState<
    { mode: "create" } | { mode: "edit"; transaction: Transaction } | null
  >(null);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadAccounts = useCallback(async (signal?: AbortSignal) => {
    const response = await listAccounts(signal);
    setAccounts(response.items);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setAccountsLoading(true);

    loadAccounts(controller.signal)
      .catch(() => {
        if (!controller.signal.aborted) {
          setAccounts([]);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setAccountsLoading(false);
        }
      });

    return () => controller.abort();
  }, [loadAccounts]);

  useEffect(() => {
    const controller = new AbortController();

    listCategories(undefined, controller.signal)
      .then((response) => setCategories(response.items))
      .catch(() => {
        if (!controller.signal.aborted) {
          setCategories([]);
        }
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    listTransactions(
      { ...filters, page_size: PAGE_SIZE },
      controller.signal,
    )
      .then((response) => setData(response))
      .catch((caught: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        setData(null);
        setError(
          caught instanceof Error
            ? caught.message
            : "No pudimos cargar los movimientos.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [filters, refreshToken]);

  function applyFilters(values: FilterValues) {
    const params = toSearchParams(values);
    params.delete("page");
    setSearchParams(params);
  }

  function clearFilters() {
    setSearchParams(new URLSearchParams());
  }

  function goToPage(page: number) {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(page));
    setSearchParams(next);
  }

  async function reloadAfterMutation() {
    setRefreshToken((current) => current + 1);
    await loadAccounts().catch(() => undefined);
  }

  async function handleSubmit(
    input: TransactionInput,
    idempotencyKey: string,
  ) {
    if (formState?.mode === "edit") {
      await updateTransaction(
        formState.transaction.id,
        input,
        idempotencyKey,
      );
      toast({ title: "Movimiento actualizado", variant: "success" });
    } else {
      await createTransaction(input, idempotencyKey);
      toast({ title: "Movimiento registrado", variant: "success" });
    }

    setFormState(null);
    await reloadAfterMutation();
  }

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);

    try {
      await deleteTransaction(deleteTarget.id);
      setDeleteTarget(null);
      toast({ title: "Movimiento eliminado", variant: "success" });
      await reloadAfterMutation();
    } catch (caught: unknown) {
      toast({
        title: "No pudimos eliminar el movimiento",
        description:
          caught instanceof Error ? caught.message : "Inténtalo de nuevo.",
        variant: "error",
      });
    } finally {
      setDeleting(false);
    }
  }

  const totalPages = data
    ? Math.max(1, Math.ceil(data.total / data.page_size))
    : 1;

  return (
    <div className="page">
      <header className="page-header page-header--row">
        <div>
          <p className="eyebrow">Movimientos</p>
          <h1>Ingresos y gastos</h1>
          <p className="page-header__lead">
            Registra cada movimiento en la moneda de su cuenta. Los importes se
            guardan como texto decimal, sin aritmética de punto flotante.
          </p>
        </div>
        <Button onClick={() => setFormState({ mode: "create" })}>
          <Plus aria-hidden="true" size={18} />
          Nuevo movimiento
        </Button>
      </header>

      {accountsLoading ? (
        <Card title="Saldos por cuenta">
          <div className="skeleton-stack" role="status">
            <Skeleton width="55%" height={16} />
            <Skeleton width="80%" height={14} />
            <Skeleton width="40%" height={14} />
            <span className="sr-only">Cargando saldos de cuentas…</span>
          </div>
        </Card>
      ) : (
        <AccountBalances accounts={accounts} />
      )}

      <Card title="Filtros">
        <TransactionFilters
          accounts={accounts}
          categories={categories}
          values={filters}
          disabled={loading}
          onChange={applyFilters}
          onClear={clearFilters}
        />
      </Card>

      {loading && (
        <Card>
          <div className="skeleton-stack" role="status">
            <Skeleton width="40%" height={18} />
            <Skeleton width="100%" height={44} />
            <Skeleton width="100%" height={44} />
            <Skeleton width="100%" height={44} />
            <span className="sr-only">Cargando movimientos…</span>
          </div>
        </Card>
      )}

      {!loading && error && (
        <Card>
          <ErrorState
            title="No pudimos cargar los movimientos"
            description={error}
            onRetry={() => setRefreshToken((current) => current + 1)}
          />
        </Card>
      )}

      {!loading && !error && data && data.items.length === 0 && (
        <Card>
          <EmptyState
            icon={<ReceiptText size={28} />}
            title="Aún no hay movimientos"
            description="Registra tu primer ingreso o gasto para empezar a ver tu historial."
            action={
              <Button onClick={() => setFormState({ mode: "create" })}>
                Crear el primer movimiento
              </Button>
            }
          />
        </Card>
      )}

      {!loading && !error && data && data.items.length > 0 && (
        <Card title="Historial">
          <div className="table-scroll" role="region" aria-label="Historial de movimientos" tabIndex={0}>
            <table className="transactions-table">
              <caption className="sr-only">
                Movimientos registrados, página {filters.page} de {totalPages}
              </caption>
              <thead>
                <tr>
                  <th scope="col">Tipo</th>
                  <th scope="col">Fecha</th>
                  <th scope="col">Cuenta</th>
                  <th scope="col">Categoría</th>
                  <th scope="col">Descripción</th>
                  <th scope="col" className="transactions-table__amount">
                    Importe
                  </th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((transaction) => {
                  const account = accounts.find(
                    (item) => item.id === transaction.account_id,
                  );
                  const category =
                    transaction.category_name ??
                    categories.find((item) => item.id === transaction.category_id)
                      ?.name ??
                    "Sin categoría";
                  const signedAmount =
                    transaction.type === "expense"
                      ? `-${transaction.amount}`
                      : transaction.amount;
                  const rowLabel = `${category}, ${formatDate(
                    transaction.transaction_date,
                  )}`;

                  return (
                    <tr key={transaction.id}>
                      <td>
                        <span
                          className={`badge badge--${transaction.type}`}
                        >
                          {transaction.type === "income" ? "Ingreso" : "Gasto"}
                        </span>
                      </td>
                      <td>{formatDate(transaction.transaction_date)}</td>
                      <td>{account?.name ?? "Cuenta no disponible"}</td>
                      <td>{category}</td>
                      <td className="transactions-table__description">
                        {transaction.description || "—"}
                      </td>
                      <td className="transactions-table__amount money">
                        {formatMoney(signedAmount, transaction.currency)}
                      </td>
                      <td>
                        <div className="row-actions">
                          <Button
                            size="sm"
                            variant="ghost"
                            aria-label={`Editar movimiento: ${rowLabel}`}
                            onClick={() =>
                              setFormState({ mode: "edit", transaction })
                            }
                          >
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            aria-label={`Eliminar movimiento: ${rowLabel}`}
                            onClick={() => setDeleteTarget(transaction)}
                          >
                            Eliminar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <nav className="pagination" aria-label="Paginación de movimientos">
            <Button
              variant="secondary"
              size="sm"
              disabled={filters.page <= 1}
              onClick={() => goToPage(filters.page - 1)}
            >
              Anterior
            </Button>
            <span aria-live="polite">
              Página {data.page} de {totalPages} · {data.total} movimientos
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={filters.page >= totalPages}
              onClick={() => goToPage(filters.page + 1)}
            >
              Siguiente
            </Button>
          </nav>
        </Card>
      )}

      <p className="disclaimer">
        Los movimientos y saldos son datos registrados por ti. No representan
        saldos bancarios reales.
      </p>

      <Modal
        open={formState !== null}
        onClose={() => setFormState(null)}
        title={
          formState?.mode === "edit"
            ? "Editar movimiento"
            : "Nuevo movimiento"
        }
        description="La moneda se hereda de la cuenta y no se puede editar."
      >
        {formState && (
          <TransactionForm
            key={
              formState.mode === "edit"
                ? formState.transaction.id
                : "create"
            }
            mode={formState.mode}
            accounts={accounts}
            initial={
              formState.mode === "edit" ? formState.transaction : undefined
            }
            onCancel={() => setFormState(null)}
            onSubmit={handleSubmit}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Eliminar movimiento"
        description="El movimiento se eliminará del historial y el saldo de la cuenta se actualizará. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        variant="danger"
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      >
        {deleteTarget && (
          <p>
            {deleteTarget.type === "income" ? "Ingreso" : "Gasto"} de{" "}
            {formatMoney(
              deleteTarget.type === "expense"
                ? `-${deleteTarget.amount}`
                : deleteTarget.amount,
              deleteTarget.currency,
            )}{" "}
            del {formatDate(deleteTarget.transaction_date)}.
          </p>
        )}
      </ConfirmDialog>
    </div>
  );
}
