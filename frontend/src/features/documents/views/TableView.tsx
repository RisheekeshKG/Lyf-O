import { useMemo, useState } from "react";
import { Icon } from "../../../ui/Icon";
import { Menu } from "../../../ui/Menu";
import { cn } from "../../../lib/cn";
import { CheckboxCell, DateCell, NumberCell, OptionCell, TextCell } from "./EditableCell";
import { COLUMN_TYPES, COLUMN_TYPE_META, type ColumnType } from "./cellStyles";
import type { ViewProps } from "./types";

interface SortState {
  column: number;
  direction: "asc" | "desc";
}

export function TableView({ data, onChange }: ViewProps) {
  const columns: any[] = data.columns ?? [];
  const rows: any[][] = data.values ?? [];
  const [sort, setSort] = useState<SortState | null>(null);
  const [renaming, setRenaming] = useState<number | null>(null);

  // Sorting is a view concern — the file keeps its authored row order.
  const order = useMemo(() => {
    const indices = rows.map((_, index) => index);
    if (!sort) return indices;

    return [...indices].sort((a, b) => {
      const left = String(rows[a][sort.column] ?? "");
      const right = String(rows[b][sort.column] ?? "");
      const compared = left.localeCompare(right, undefined, { numeric: true });
      return sort.direction === "asc" ? compared : -compared;
    });
  }, [rows, sort]);

  const setCell = (rowIndex: number, colIndex: number, value: string) =>
    onChange({
      ...data,
      values: rows.map((row, r) =>
        r === rowIndex ? row.map((cell, c) => (c === colIndex ? value : cell)) : row,
      ),
    });

  const addRow = () => onChange({ ...data, values: [...rows, columns.map(() => "")] });

  const deleteRow = (rowIndex: number) =>
    onChange({ ...data, values: rows.filter((_, r) => r !== rowIndex) });

  const duplicateRow = (rowIndex: number) =>
    onChange({
      ...data,
      values: [...rows.slice(0, rowIndex + 1), [...rows[rowIndex]], ...rows.slice(rowIndex + 1)],
    });

  const addColumn = () =>
    onChange({
      ...data,
      columns: [...columns, { name: `Column ${columns.length + 1}`, type: "text" }],
      values: rows.map((row) => [...row, ""]),
    });

  const deleteColumn = (colIndex: number) => {
    setSort(null);
    onChange({
      ...data,
      columns: columns.filter((_, c) => c !== colIndex),
      values: rows.map((row) => row.filter((_, c) => c !== colIndex)),
    });
  };

  const patchColumn = (colIndex: number, patch: any) =>
    onChange({
      ...data,
      columns: columns.map((column, c) => (c === colIndex ? { ...column, ...patch } : column)),
    });

  const toggleSort = (colIndex: number) =>
    setSort((current) =>
      current?.column === colIndex
        ? current.direction === "asc"
          ? { column: colIndex, direction: "desc" }
          : null
        : { column: colIndex, direction: "asc" },
    );

  const renderCell = (rowIndex: number, colIndex: number) => {
    const column = columns[colIndex];
    const value = rows[rowIndex][colIndex] ?? "";
    const set = (next: string) => setCell(rowIndex, colIndex, next);

    switch (column.type as ColumnType) {
      case "options":
        return (
          <OptionCell
            value={value}
            options={column.options ?? []}
            onChange={set}
            onAddOption={(option) =>
              patchColumn(colIndex, { options: [...(column.options ?? []), option] })
            }
          />
        );
      case "date":
        return <DateCell value={value} onChange={set} />;
      case "checkbox":
        return <CheckboxCell value={value} onChange={set} />;
      case "number":
        return <NumberCell value={value} onChange={set} />;
      default:
        return <TextCell value={value} onChange={set} />;
    }
  };

  return (
    <div className="rounded-xl border border-outline-variant/40 overflow-hidden bg-surface-container-low/30">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse table-fixed">
          <colgroup>
            <col className="w-8" />
            {columns.map((column, index) => (
              <col
                key={index}
                className={
                  column.type === "checkbox" || column.type === "number"
                    ? "w-32"
                    : column.type === "date"
                      ? "w-40"
                      : column.type === "options"
                        ? "w-48"
                        : ""
                }
              />
            ))}
            <col className="w-10" />
          </colgroup>

          <thead>
            <tr className="border-b border-outline-variant/30 bg-surface-container-low/60">
              <th className="h-row-standard" />

              {columns.map((column, colIndex) => {
                const meta = COLUMN_TYPE_META[(column.type as ColumnType) ?? "text"] ??
                  COLUMN_TYPE_META.text;

                return (
                  <th key={colIndex} className="h-row-standard px-space-base text-left group/head">
                    {renaming === colIndex ? (
                      <input
                        autoFocus
                        value={column.name}
                        onChange={(event) => patchColumn(colIndex, { name: event.target.value })}
                        onBlur={() => setRenaming(null)}
                        onKeyDown={(event) => event.key === "Enter" && event.currentTarget.blur()}
                        className="w-full bg-surface-container-lowest rounded px-space-xs py-space-2xs ring-2 ring-primary-container/60 font-label-md text-label-md text-on-surface outline-none"
                      />
                    ) : (
                      <div className="flex items-center gap-space-xs min-w-0">
                        <Icon
                          name={meta.icon}
                          size={13}
                          className="text-on-surface-variant/40 shrink-0"
                        />

                        <button
                          onClick={() => toggleSort(colIndex)}
                          className="flex items-center gap-space-2xs min-w-0 font-label-md text-label-md text-on-surface-variant/80 hover:text-on-surface transition-colors"
                        >
                          <span className="truncate">{column.name}</span>
                          {sort?.column === colIndex && (
                            <Icon
                              name={sort.direction === "asc" ? "arrow_upward" : "arrow_downward"}
                              size={12}
                              className="text-primary shrink-0"
                            />
                          )}
                        </button>

                        <div className="ml-auto opacity-0 group-hover/head:opacity-100 transition-opacity">
                          <Menu
                            align="right"
                            actions={[
                              {
                                label: "Rename",
                                icon: "edit",
                                onSelect: () => setRenaming(colIndex),
                              },
                              {
                                label: sort?.column === colIndex ? "Clear sort" : "Sort ascending",
                                icon: "swap_vert",
                                onSelect: () =>
                                  sort?.column === colIndex ? setSort(null) : toggleSort(colIndex),
                              },
                              ...COLUMN_TYPES.filter((type) => type !== column.type).map((type) => ({
                                label: `Change to ${COLUMN_TYPE_META[type].label}`,
                                icon: COLUMN_TYPE_META[type].icon,
                                onSelect: () =>
                                  patchColumn(colIndex, {
                                    type,
                                    options:
                                      type === "options" ? (column.options ?? []) : undefined,
                                  }),
                              })),
                              {
                                label: "Delete property",
                                icon: "delete",
                                danger: true,
                                disabled: columns.length <= 1,
                                onSelect: () => deleteColumn(colIndex),
                              },
                            ]}
                          />
                        </div>
                      </div>
                    )}
                  </th>
                );
              })}

              <th className="h-row-standard">
                <button
                  aria-label="Add property"
                  title="Add property"
                  onClick={addColumn}
                  className="w-full h-full flex items-center justify-center text-on-surface-variant/40 hover:text-on-surface hover:bg-surface-container transition-colors"
                >
                  <Icon name="add" size={15} />
                </button>
              </th>
            </tr>
          </thead>

          <tbody>
            {order.map((rowIndex, position) => (
              <tr
                key={rowIndex}
                className="group border-b border-outline-variant/15 hover:bg-surface-container-low/50 transition-colors"
              >
                <td className="text-center align-middle">
                  <span className="font-mono-badge text-mono-badge text-on-surface-variant/25 group-hover:hidden">
                    {position + 1}
                  </span>
                  <span className="hidden group-hover:flex justify-center">
                    <Menu
                      align="left"
                      trigger={<Icon name="drag_indicator" size={14} />}
                      label="Row actions"
                      actions={[
                        {
                          label: "Duplicate",
                          icon: "content_copy",
                          onSelect: () => duplicateRow(rowIndex),
                        },
                        {
                          label: "Delete",
                          icon: "delete",
                          danger: true,
                          onSelect: () => deleteRow(rowIndex),
                        },
                      ]}
                    />
                  </span>
                </td>

                {columns.map((_, colIndex) => (
                  <td
                    key={colIndex}
                    className={cn(
                      "align-middle p-0",
                      colIndex < columns.length - 1 && "border-r border-outline-variant/10",
                    )}
                  >
                    {renderCell(rowIndex, colIndex)}
                  </td>
                ))}

                <td />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={addRow}
        className="w-full flex items-center gap-space-xs h-row-standard px-space-base font-body-md text-body-md text-on-surface-variant/40 hover:text-on-surface hover:bg-surface-container-low/50 transition-colors"
      >
        <Icon name="add" size={15} />
        New
      </button>

      <footer className="flex items-center justify-between px-space-base py-space-xs border-t border-outline-variant/20">
        <span className="font-label-sm text-label-sm text-on-surface-variant/40">
          {rows.length} {rows.length === 1 ? "item" : "items"}
        </span>
        {sort && (
          <button
            onClick={() => setSort(null)}
            className="flex items-center gap-space-2xs font-label-sm text-label-sm text-on-surface-variant/50 hover:text-on-surface transition-colors"
          >
            <Icon name="swap_vert" size={13} />
            Sorted by {columns[sort.column]?.name}
            <Icon name="close" size={12} />
          </button>
        )}
      </footer>
    </div>
  );
}
