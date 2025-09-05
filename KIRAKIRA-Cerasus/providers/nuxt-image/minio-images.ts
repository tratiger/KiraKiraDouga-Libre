import { encodeQueryItem, joinURL } from "ufo";  
import type { ProviderGetImage } from "./types";  
import { createOperationsGenerator } from "#image";  
  
const operationsGenerator = createOperationsGenerator({  
    keyMap: {  
        width: "w",  
        height: "h",  
        quality: "q",  
        format: "f",  
    },  
    joinWith: "&",  
    formatter: (key: string, val: string) => encodeQueryItem(key, val),  
});  
  
const defaultModifiers = {};  
  
// MinIO S3互換APIのURL形式  
export const getImage: ProviderGetImage = (src, {  
    modifiers = {},  
    baseURL = "/",  
} = {}) => {  
    const mergeModifiers = { ...defaultModifiers, ...modifiers };  
    const operations = operationsGenerator(mergeModifiers as Record<string, string>);  
  
    // MinIOのオブジェクトURL形式: https://minio-endpoint/bucket-name/object-key  
    const url = operations ? joinURL(baseURL, src, `?${operations}`) : joinURL(baseURL, src);  
  
    return {  
        url,  
    };  
};