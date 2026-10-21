import { RotateCcw } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import s from './ProgressErrorCard.module.css';

/** Mostrado pelo ProgressProvider quando o load falha. Nada é salvo nesse estado. */
export function ProgressErrorCard({ onRetry }: { onRetry: () => void }) {
  return (
    <div className={s.wrap}>
      <Card padding="lg" className={s.card} role="alert">
        <p className={s.message}>Não foi possível carregar seu progresso.</p>
        <Button variant="primary" leftIcon={<RotateCcw size={18} aria-hidden="true" />} onClick={onRetry}>
          Tentar novamente
        </Button>
      </Card>
    </div>
  );
}
