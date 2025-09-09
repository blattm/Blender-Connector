export function isEnumValue<T extends Record<string, unknown>> (enumObject: T, value: unknown): value is T[keyof T]
{
    if (typeof value !== 'string' && typeof value !== 'number')
    {
        return false;
    }

    return Object.values(enumObject).includes(value);
}

/**
 * Initialises a two-dimensional array (array of arrays) with the given dimensions and fills it with the specified initial value.
 * @param length The number of inner arrays.
 * @param innerLength The length of each inner array.
 * @param initialValue The value to fill each element with.
 * @returns A two-dimensional array filled with the initial value.
 */
export function initialiseArrayOfArrays<T> (length: number, innerLength: number, initialValue: T): T[][]
{
    const array: T[][] = new Array<T[]>(length);

    for (let i = 0; i < length; i++)
    {
        array[i] = new Array<T>(innerLength).fill(initialValue);
    }

    return array;
}
