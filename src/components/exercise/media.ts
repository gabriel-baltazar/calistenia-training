/** URL de um quadro do free-exercise-db: `${baseUrl}/${mediaId}/${frame}.jpg`. */
export const mediaUrl = (baseUrl: string, mediaId: string, frame: 0 | 1): string => `${baseUrl}/${mediaId}/${frame}.jpg`;

/** Link de busca do YouTube para o vídeo tutorial. */
export const videoUrl = (query: string): string => `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
