const IMGUR_CLIENT_ID = 'b4f0a3b82615df1';

const getProxiedImageUrl = (url: string) => {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const baseUrl = 'https://images.weserv.nl/';
  const params = new URLSearchParams({
    url: url,
    n: '-1', // Отключаем кэширование на стороне weserv
    output: 'jpg', // Всегда конвертируем в jpg
    q: isMobile ? '85' : '95', // Качество изображения
    w: isMobile ? '800' : '1600', // Ширина изображения
  });

  return `${baseUrl}?${params.toString()}`;
};

export const uploadToImgur = async (file: File): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch('https://api.imgur.com/3/image', {
      method: 'POST',
      headers: {
        Authorization: `Client-ID ${IMGUR_CLIENT_ID}`,
        Accept: 'application/json',
      },
      body: formData,
    });

    if (!response.ok) {
      console.error('Imgur response:', await response.text());
      throw new Error('Failed to upload image');
    }

    const data = await response.json();
    console.log('Imgur response data:', data);

    if (!data.success || !data.data?.link) {
      throw new Error('Invalid response from Imgur');
    }

    return getProxiedImageUrl(data.data.link);
  } catch (error) {
    console.error('Error uploading to Imgur:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to upload image');
  }
};
