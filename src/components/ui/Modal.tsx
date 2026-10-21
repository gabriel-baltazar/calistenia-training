import { useEffect, useId, useLayoutEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, m } from 'framer-motion';
import { X } from 'lucide-react';
import { cx } from '../../lib/cx';
import { springSheet } from '../../design/motion';
import { useMotionInitial } from '../../design/motionStatus';
import { IconButton } from './IconButton';
import s from './Modal.module.css';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** sheet = sobe de baixo no mobile; vira dialog ≥ 768 px. */
  variant?: 'dialog' | 'sheet';
  children?: ReactNode;
  footer?: ReactNode;
  closeLabel?: string;
  className?: string;
}

const FOCUSABLE =
  'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), iframe, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

// Contador global: modais aninhados não liberam o scroll antes da hora.
let scrollLocks = 0;
let previousOverflow = '';

function lockScroll(): () => void {
  if (scrollLocks === 0) {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  scrollLocks++;
  return () => {
    scrollLocks--;
    if (scrollLocks === 0) document.body.style.overflow = previousOverflow;
  };
}

export function Modal(props: ModalProps) {
  if (typeof document === 'undefined') return null;
  return createPortal(<AnimatePresence>{props.open && <ModalContent key="modal" {...props} />}</AnimatePresence>, document.body);
}

function ModalContent({ onClose, title, variant = 'dialog', children, footer, closeLabel = 'Fechar', className }: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useLayoutEffect(() => {
    onCloseRef.current = onClose;
  });

  const backdropInitial = useMotionInitial({ opacity: 0 });
  const panelInitial = useMotionInitial(variant === 'sheet' ? { y: '100%' } : { opacity: 0, scale: 0.96 });

  useEffect(() => {
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const unlock = lockScroll();
    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel)?.focus({ preventScroll: true });

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (items.length === 0) {
        e.preventDefault();
        panel.focus();
        return;
      }
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === firstItem || active === panel)) {
        e.preventDefault();
        lastItem?.focus();
      } else if (!e.shiftKey && active === lastItem) {
        e.preventDefault();
        firstItem?.focus();
      } else if (active instanceof Node && !panel.contains(active)) {
        e.preventDefault();
        firstItem?.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      unlock();
      // Devolve o foco ao gatilho, se ele ainda estiver na página.
      if (trigger && trigger.isConnected) trigger.focus({ preventScroll: true });
    };
  }, []);

  return (
    <div className={cx(s.root, variant === 'sheet' && s.rootSheet)}>
      <m.div
        className={s.backdrop}
        initial={backdropInitial}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={() => onCloseRef.current()}
        aria-hidden="true"
      />
      <m.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cx('glass-strong', s.panel, variant === 'sheet' ? s.sheet : s.dialog, className)}
        initial={panelInitial}
        animate={variant === 'sheet' ? { y: 0 } : { opacity: 1, scale: 1 }}
        exit={variant === 'sheet' ? { y: '100%' } : { opacity: 0, scale: 0.96 }}
        transition={variant === 'sheet' ? springSheet : { duration: 0.18, ease: 'easeOut' }}
      >
        {variant === 'sheet' && <span className={s.grabber} aria-hidden="true" />}
        <header className={s.header}>
          <h2 id={titleId} className={s.title}>
            {title}
          </h2>
          <IconButton icon={<X size={20} />} label={closeLabel} variant="ghost" onClick={() => onCloseRef.current()} />
        </header>
        <div className={s.body}>{children}</div>
        {footer && <footer className={s.footer}>{footer}</footer>}
      </m.div>
    </div>
  );
}
