import type { Transition, Variants } from 'framer-motion';

/** Transição de página (AppShell, §5). */
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  enter: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.12 } },
};

/** Contêiner com stagger + item (lista de exercícios, StatTiles). */
export const listStagger: { container: Variants; item: Variants } = {
  container: {
    initial: {},
    enter: { transition: { staggerChildren: 0.04 } },
  },
  item: {
    initial: { opacity: 0, y: 8 },
    enter: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
  },
};

/** Pulso ao marcar (SetToggle). */
export const pop = {
  scale: [1, 1.18, 1],
  transition: { duration: 0.25 },
};

/** Mola dos sheets/modais. */
export const springSheet: Transition = { type: 'spring', damping: 30, stiffness: 300 };
