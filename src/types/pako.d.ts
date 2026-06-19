declare module "pako" {
  export function deflate(data: string): Uint8Array;
  export function inflate(data: Uint8Array, options: { to: "string" }): string;
}
