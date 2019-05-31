export default (blob: Blob, fileName: string, type: string): File =>
  new File([blob], fileName, {
    type,
  });
