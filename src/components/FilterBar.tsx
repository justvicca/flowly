import type { StatusFilter } from '../types';

interface FilterBarProps {
  filter: StatusFilter;
  onFilterChange: (filter: StatusFilter) => void;
}

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'pending', label: 'Pendentes' },
  { value: 'completed', label: 'Concluídas' },
  { value: 'postponed', label: 'Adiadas' },
];

export function FilterBar({ filter, onFilterChange }: FilterBarProps) {
  return (
    <div role="tablist" aria-label="Filtrar tarefas por status" style={{ display: 'flex', gap: '8px' }}>
      {FILTERS.map(({ value, label }) => (
        <button
          key={value}
          role="tab"
          aria-selected={filter === value}
          onClick={() => onFilterChange(value)}
          style={{
            padding: '6px 16px',
            cursor: 'pointer',
            fontWeight: filter === value ? 'bold' : 'normal',
            background: 'none',
            border: 'none',
            borderBottom: filter === value ? '2px solid #1976d2' : '2px solid transparent',
            color: filter === value ? '#1976d2' : 'inherit',
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
