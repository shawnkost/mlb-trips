const defaultTestDatabaseUrl =
  "postgres://mlb:mlb@localhost:5432/mlb_trips_test";

export function assertTestDatabaseUrl(url: string) {
  const name = new URL(url).pathname.slice(1);
  if (!name.endsWith("_test")) {
    throw new Error(
      `Refusing to run tests against "${name}": the database name must end with "_test"`,
    );
  }
  return url;
}

export function testDatabaseUrl() {
  return assertTestDatabaseUrl(
    process.env.TEST_DATABASE_URL ?? defaultTestDatabaseUrl,
  );
}
