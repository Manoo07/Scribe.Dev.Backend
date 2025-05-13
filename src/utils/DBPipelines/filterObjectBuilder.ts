export function buildWhereClause(obj: any): any {
  const result: any = {};

  for (const key in obj) {
    const value = obj[key];

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result[key] = buildWhereClause(value);
    } else {
      result[key] = value;
    }
  }

  return result;
}
