import { ReactNode, HTMLAttributes, TdHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

// Extendemos de HTMLAttributes para permitir props estándar (onClick, style, etc.)
interface TableProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export function Table({ children, className, ...props }: TableProps) {
  return (
    <div className={cn('w-full overflow-hidden rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm shadow-sm', className)} {...props}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm caption-bottom">
          {children}
        </table>
      </div>
    </div>
  );
}

interface TableSectionProps extends HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
  className?: string;
}

export function TableHeader({ children, className, ...props }: TableSectionProps) {
  return (
    <thead className={cn('bg-muted/30 border-b border-border/50', className)} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className, ...props }: TableSectionProps) {
  return (
    <tbody className={cn('divide-y divide-border/40 [&_tr:last-child]:border-0', className)} {...props}>
      {children}
    </tbody>
  );
}

interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  children: ReactNode;
  className?: string;
}

export function TableRow({ children, className, ...props }: TableRowProps) {
  return (
    <tr className={cn(
      'border-b border-border/40 transition-colors hover:bg-muted/40 data-[state=selected]:bg-muted', 
      className
    )} {...props}>
      {children}
    </tr>
  );
}

// CORRECCIÓN PRINCIPAL AQUÍ:
// Extendemos de TdHTMLAttributes para aceptar 'colSpan', 'rowSpan', etc.
interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  children: ReactNode;
  className?: string;
  header?: boolean;
}

export function TableCell({ children, className, header = false, ...props }: TableCellProps) {
  const Component = header ? 'th' : 'td';
  return (
    <Component
      className={cn(
        'p-4 align-middle [&:has([role=checkbox])]:pr-0',
        header
          ? 'h-10 text-xs font-semibold text-muted-foreground uppercase tracking-wider select-none'
          : 'text-foreground font-medium',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}