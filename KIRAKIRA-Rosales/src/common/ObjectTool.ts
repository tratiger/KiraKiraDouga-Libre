/**
 * オブジェクトが空かどうかを判断します
 */
export const isEmptyObject = (obj: object) => typeof obj === 'object' && !(Array.isArray(obj)) && Object.keys(obj).length === 0

/**
 * オブジェクトから値がundefinedの要素を削除し、新しいオブジェクトを返します
 * 基本的な原理は、undefinedでないすべての要素を新しいオブジェクトに（浅く）コピーすることです
 * @param obj 値がundefinedの要素をクリーンアップする必要があるオブジェクト
 * @returns 値がundefinedの要素がクリーンアップされたオブジェクト
 */
export const clearUndefinedItemInObject = <T extends Record<string, any> >(obj: T): Partial<T> => {
	const newObj: Partial<T> = {};
  (Object.keys(obj) as (keyof T)[]).forEach(key => {
    if (obj[key] !== undefined) {
      newObj[key] = obj[key];
    }
  });
  return newObj;
}
