export default (base64: string): Promise<number> =>
  new Promise((resolve, reject) => {
    try {
      const img = new Image();
      img.onload = () => {
        resolve(img.width);
      };
      img.src = base64;
    } catch (e) {
      reject(e);
    }
  });
