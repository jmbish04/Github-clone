/**
 * Core utilities for the Cloudflare Agents template
 * DO NOT MODIFY THIS FILE - Hidden from AI to prevent breaking core functionality
 */
import { GlobalDurableObject } from './durableObject';

export { GlobalDurableObject };

export type Env = {
    GlobalDurableObject: DurableObjectNamespace<GlobalDurableObject>;
    KVStore: KVNamespace;
}
export interface ClientErrorReport {
    message: string;
    url: string;
    userAgent: string;
    timestamp: string;
    stack?: string;
    componentStack?: string;
    errorBoundary?: boolean;
    errorBoundaryProps?: Record<string, unknown>;
    source?: string;
    lineno?: number;
    colno?: number;
    error?: unknown;
  }
  export interface ApiResponse<T = unknown> { success: boolean; data?: T; error?: string; }