/* eslint-disable @typescript-eslint/no-explicit-any */

export type Constructor = new (...args: any[]) => object;

export type GenericConstructor<T = object> = new (...args: any[]) => T;
