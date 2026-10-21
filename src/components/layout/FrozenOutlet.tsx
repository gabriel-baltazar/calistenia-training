import { useState } from 'react';
import { useOutlet } from 'react-router-dom';

/**
 * Congela o elemento da rota no primeiro render, para que a página que está saindo continue mostrando o
 * próprio conteúdo (e os próprios params) durante a animação de saída do AppShell (§5).
 */
export function FrozenOutlet() {
  const outlet = useOutlet();
  const [frozen] = useState(outlet);
  return frozen;
}
