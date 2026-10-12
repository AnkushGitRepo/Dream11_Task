import { createContext } from 'react';

/** When provided (e.g. by the Match Room), badges open the shared info sheet instead of their inline one. */
export const VerifiedInfoContext = createContext<(() => void) | null>(null);
