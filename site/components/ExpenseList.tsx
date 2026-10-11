"use client";
import { useTrip } from "./TripProvider";
import { usd } from "@/lib/format";
import { EXPENSE_CATEGORIES, EXPENSE_STATUS } from "@/lib/labels";
import type { Activity, Day, Expense } from "@/lib/types";

export function ActivityCost({ day, activity }: { day: Day; activity: Activity }) {
  const { expensesOfDay, totalOf } = useTrip();
  const expenses = expensesOfDay(day).filter((e) => e.atividade === activity.titulo);
  if (!expenses.length) return null;
  if (expenses.every((e) => e.status === "opcional")) return <span className="cost optional num">opcional · {usd(expenses.reduce((sum, e) => sum + e.usd, 0))}</span>;
  const total = totalOf(expenses);
  const approximate = expenses.some((e) => e.status !== "confirmado") ? "≈ " : "";
  return <span className="cost num">{total ? approximate + usd(total) : "incluído"}</span>;
}

export function ExpenseRow({ expense }: { expense: Expense }) {
  const amount = expense.usd ? usd(expense.usd) : expense.status === "verificar" ? "a definir" : "incluído";
  return (
    <li>
      <span className="txt">
        <span className="t">{expense.item}</span>
        <span className="s">
          {EXPENSE_CATEGORIES[expense.categoria] ?? expense.categoria} · {EXPENSE_STATUS[expense.status] ?? expense.status}
        </span>
      </span>
      <b className={`num${expense.status === "opcional" ? " optional" : ""}`}>{amount}</b>
    </li>
  );
}

export function ExpenseList({ expenses, totalLabel }: { expenses: Expense[]; totalLabel?: string }) {
  const { totalOf } = useTrip();
  return (
    <ul className="expenses list">
      {expenses.map((expense, i) => (
        <ExpenseRow key={i} expense={expense} />
      ))}
      {totalLabel && (
        <li className="expenses-total">
          <span>{totalLabel}</span>
          <b className="num">{usd(totalOf(expenses))}</b>
        </li>
      )}
    </ul>
  );
}
