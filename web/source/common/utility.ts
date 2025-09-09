export function isEnumValue<T extends Record<string, unknown>> (enumObject: T, value: unknown): value is T[keyof T]
{
    if (typeof value !== 'string' && typeof value !== 'number')
    {
        return false;
    }

    return Object.values(enumObject).includes(value);
}
