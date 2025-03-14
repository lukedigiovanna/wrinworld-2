
const images = new Map<string, HTMLImageElement>();

const loadImage = (id: string, url: string) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
      images.set(id, img);
    });
  }
  

const getImage = (id: string): HTMLImageElement => {
    const img = images.get(id);
    if (!img) {
      console.error("Warning: getting an undefined image... returning the undefined sprite")
        return getImage("undefined");
    }
    return img;
}

const imageExists = (id: string): boolean => {
  return images.has(id);
}

export { loadImage, getImage, imageExists };
