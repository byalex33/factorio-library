declare module "pako" {
  export function inflate(data: Uint8Array, options: { to: "string" }): string;
}
