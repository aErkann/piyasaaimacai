import type { TrapItem } from './types';
export declare function fetchAllTraps(filter?: string): Promise<TrapItem[]>;
export declare function fetchMarketTraps(): Promise<TrapItem[]>;
export declare function fetchMatchTraps(): Promise<TrapItem[]>;
export declare function fetchTrapDetail(id: string): Promise<TrapItem | null>;
//# sourceMappingURL=trap.d.ts.map