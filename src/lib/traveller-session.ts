/** Bound route authentication without accepting a stale/unchecked session. */
export async function checkTravellerSession<T>(verify: () => Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      verify(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("Sign-in verification timed out. Please retry.")),
          10000,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
