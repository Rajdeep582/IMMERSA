/** Open Doctor Murphy from anywhere (optionally with a draft question in the input). */
export const openMurphy = (draft?: string) => window.dispatchEvent(new CustomEvent('immersa:murphy', { detail: { draft } }));
