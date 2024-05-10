export const preloadImage = (src) => {
  const img = new Image();
  img.src = src;
};

export const sleep = async (timeout) =>
  new Promise((resolve) => window.setTimeout(resolve, timeout));
