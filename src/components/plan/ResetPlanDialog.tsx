import { useProgress } from '../../progress/ProgressProvider';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { useToast } from '../ui/Toast';

export interface ResetPlanDialogProps {
  open: boolean;
  onClose: () => void;
}

/** "Reiniciar plano?" — usado no Plano ("Reiniciar plano") e no Perfil ("Zerar progresso do plano"). */
export function ResetPlanDialog({ open, onClose }: ResetPlanDialogProps) {
  const { resetPlan } = useProgress();
  const { toast } = useToast();
  return (
    <ConfirmDialog
      open={open}
      title="Reiniciar plano?"
      message="Todos os dias e séries marcados deste plano serão apagados. Esta ação não pode ser desfeita."
      confirmLabel="Reiniciar"
      tone="danger"
      onCancel={onClose}
      onConfirm={() => {
        resetPlan();
        onClose();
        toast({ message: 'Plano reiniciado.', tone: 'success' });
      }}
    />
  );
}
