/**
 *
 * JavaScriptで複雑なオブジェクト配列の重複を除去します
 * BY: ChatGPT-4, 02
 *
 * @param array 重複除去対象の配列
 * @returns 重複除去後の配列
 */
export const removeDuplicateObjects = <T>(array: T[]): T[] => {
	if (array && array.length > 0) {
		const uniqueJSONStrings = new Set()

		return array.filter(item => {
			const jsonString: string = JSON.stringify(item)
			if (!uniqueJSONStrings.has(jsonString)) {
				uniqueJSONStrings.add(jsonString)
				return true
			}
			return false
		})
	} else {
		return [] as T[]
	}
}

type NestedArray<T> = T | NestedArray<T>[]

/**
 *
 * オブジェクト配列から重複したオブジェクトを除去します。再帰的に深く比較し、より高い堅牢性を提供します
 * // ? 重複除去時、オブジェクトのプロパティの順序が異なると比較できません。{foo: 1, bar: 2} と {bar: 2, foo: 1} は異なるオブジェクトとして扱われ、パフォーマンスが向上します
 * BY: ChatGPT-4, 02
 *
 * @param array 重複除去対象の配列
 * @returns 重複除去後の配列
 */
export const removeDuplicateObjectsInDeepArrayStrong = <T>(inputArray: NestedArray<T>): T[] => {
	try {
		// 入力配列を1次元配列にフラット化します
		const flattenArray = <T>(arr: NestedArray<T>): T[] => {
			if (!Array.isArray(arr)) {
				return [arr]
			}

			return arr.reduce<T[]>((flat, toFlatten) => {
				return flat.concat(flattenArray(toFlatten))
			}, [])
		}

		// 2つのオブジェクトが等しいかどうかをチェックします
		const isEqual = (obj1: unknown, obj2: unknown): boolean => {
			return JSON.stringify(obj1) === JSON.stringify(obj2)
		}

		// 重複したオブジェクトを除去します
		const removeDuplicates = <T>(arr: T[]): T[] => {
			return arr.filter((value, index, self) => {
				return self.findIndex(item => isEqual(item, value)) === index
			})
		}

		if (inputArray && Array.isArray(inputArray) && inputArray.length > 0) {
			const flattenedArray = flattenArray<T>(inputArray)
			return removeDuplicates<T>(flattenedArray)
		} else {
			console.error('removeDuplicateObjectsStrongInDeepArray関数でエラーが発生しました。必須データ"inputArray"が空です')
			return []
		}
	} catch (error) {
		console.error('removeDuplicateObjectsStrongInDeepArray関数でエラーが発生しました')
		return []
	}
}

// オブジェクト比較関数
const objectsAreEqual = <T>(a: T, b: T): boolean => {
	if (a && b) {
		const keysA = Object.keys(a).sort()
		const keysB = Object.keys(b).sort()
		if (keysA.length !== keysB.length) {
			return false
		}
			
		for (let i = 0; i < keysA.length; i++) {
			if (keysA[i] !== keysB[i] || a[keysA[i]] !== b[keysB[i]]) {
				return false
			}
		}
			
		return true
	} else {
		console.error('objectsAreEqual関数でエラーが発生しました。必須データ"a"または"b"が空です')
		return false
	}
}


/**
 *
 * オブジェクト配列から重複したオブジェクトを除去します。再帰的に深く比較し、より高い堅牢性を提供します
 * // > 重複除去時、オブジェクトのプロパティの順序が異なっても比較可能です。{foo: 1, bar: 2} と {bar: 2, foo: 1} は同じオブジェクトとして扱われ、パフォーマンスは低下します
 * BY: ChatGPT-4, 02
 *
 * @param array 重複除去対象の配列
 * @returns 重複除去後の配列
 */
export const removeDuplicateObjectsInDeepArrayAndDeepObjectStrong = <T>(inputArray: NestedArray<T>): T[] => {
	try {
		// 入力配列を1次元配列にフラット化します
		const flattenArray = <T>(arr: NestedArray<T>): T[] => {
			if (!Array.isArray(arr)) {
				return [arr]
			}

			return arr.reduce<T[]>((flat, toFlatten) => {
				return flat.concat(flattenArray(toFlatten))
			}, [])
		}

		// 重複したオブジェクトを除去します
		const removeDuplicates = <T>(arr: T[]): T[] => {
			return arr.filter((value, index, self) => {
				return self.findIndex(item => objectsAreEqual<T>(item, value)) === index
			})
		}

		if (inputArray && Array.isArray(inputArray) && inputArray.length > 0) {
			const flattenedArray = flattenArray<T>(inputArray)
			return removeDuplicates<T>(flattenedArray)
		} else {
			console.error('removeDuplicateObjectsStrongInDeepArray関数でエラーが発生しました。必須データ"inputArray"が空です')
			return []
		}
	} catch (error) {
		console.error('removeDuplicateObjectsStrongInDeepArray関数でエラーが発生しました')
		return []
	}
}

/**
 * 2つのオブジェクト配列をマージし、重複を除去します
 * BY: ChatGPT-4, 02
 *
 * @param arr1 マージする最初のオブジェクト配列
 * @param arr2 マージする2番目のオブジェクト配列
 *
 * @returns マージおよび重複除去後の新しいオブジェクト配列
 */
export const mergeAndDeduplicateObjectArrays = <T>(arr1: T[], arr2: T[]): T[] => {
	try {
		// 配列が空かどうかをチェックします
		if (arr1 || arr2) {
			// 空の配列の場合を処理します
			if (arr1 === undefined || arr1 === null) return arr2
			if (arr2 === undefined || arr2 === null) return arr1

			// 配列をマージして重複を除去します
			const mergedArray: T[] = [...arr1, ...arr2]
			const uniqueArray: T[] = []

			
			mergedArray.forEach((item: T) => {
				if (!uniqueArray.some((uniqueItem: T) => objectsAreEqual(item, uniqueItem))) {
					uniqueArray.push(item)
				}
			})

			return uniqueArray
		} else {
			console.error('mergeAndDeduplicateObjectArrays関数でエラーが発生しました。必須データ"inputArray(arr1 and arr2)"が空です')
			return []
		}
	} catch (error) {
		console.error('mergeAndDeduplicateObjectArrays関数でエラーが発生しました')
		return []
	}
}
