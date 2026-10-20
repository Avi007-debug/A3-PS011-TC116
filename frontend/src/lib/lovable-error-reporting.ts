// Runtime error handler for ArgusASM
export function reportRuntimeError(error: unknown, context: Record<string, unknown> = {}) {
  if (process.env["NODE_ENV"] !== "production") {
    console.error("[ArgusASM Error]", error, context);
  }
}
