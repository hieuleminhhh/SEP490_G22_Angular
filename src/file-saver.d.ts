declare module 'file-saver' {
  export function saveAs(data: Blob | string | ArrayBuffer, filename: string, options?: any): void;
}
