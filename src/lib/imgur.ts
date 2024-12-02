const IMGUR_CLIENT_ID = 'b4f0a3b82615df1';

const getDirectImageUrl = (url: string) => {
  if (url.includes('i.imgur.com')) {
    return url.replace('http://', 'https://');
  }

  return url.replace('http://', 'https://').replace('imgur.com', 'i.imgur.com');
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

    return getDirectImageUrl(data.data.link);
  } catch (error) {
    console.error('Error uploading to Imgur:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to upload image');
  }
};
