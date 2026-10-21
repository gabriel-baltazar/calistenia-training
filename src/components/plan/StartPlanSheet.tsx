import { useState, type FormEvent } from 'react';
import { addDays, formatDateBR, isValidISODate, localISODate } from '../../lib/dates';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import s from './StartPlanSheet.module.css';

export interface StartPlanSheetProps {
  open: boolean;
  onClose: () => void;
  /** start = "Começar plano"; edit = alterar a data de início ("Salvar"). */
  mode: 'start' | 'edit';
  planName: string;
  /** AAAA-MM-DD; padrão hoje. */
  initialDate?: string;
  onSubmit: (startDate: string) => void;
}

const DAYS_BACK = 365;
const DAYS_AHEAD = 60;

function StartPlanForm({ mode, initialDate, onSubmit }: Pick<StartPlanSheetProps, 'mode' | 'initialDate' | 'onSubmit'>) {
  const today = localISODate(new Date());
  const min = addDays(today, -DAYS_BACK);
  const max = addDays(today, DAYS_AHEAD);
  const [value, setValue] = useState(initialDate ?? today);
  const [error, setError] = useState<string | undefined>();

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isValidISODate(value) || value < min || value > max) {
      setError(`Escolha uma data entre ${formatDateBR(min)} e ${formatDateBR(max)}.`);
      return;
    }
    onSubmit(value);
  }

  return (
    <form className={s.form} onSubmit={submit} noValidate>
      <Input
        label="Data de início"
        type="date"
        value={value}
        min={min}
        max={max}
        required
        error={error}
        onChange={(e) => {
          setValue(e.target.value);
          setError(undefined);
        }}
      />
      <p className={s.hint}>Dica: o Dia 1 é uma segunda-feira no protocolo; começar numa segunda mantém os nomes dos dias alinhados.</p>
      <Button type="submit" size="lg" fullWidth>
        {mode === 'start' ? 'Começar plano' : 'Salvar'}
      </Button>
    </form>
  );
}

/** Sheet de data de início (começar plano ou editar a data). O formulário remonta a cada abertura. */
export function StartPlanSheet({ open, onClose, mode, planName, initialDate, onSubmit }: StartPlanSheetProps) {
  return (
    <Modal open={open} onClose={onClose} title={mode === 'start' ? planName : 'Alterar data de início'} variant="sheet">
      <StartPlanForm mode={mode} initialDate={initialDate} onSubmit={onSubmit} />
    </Modal>
  );
}
