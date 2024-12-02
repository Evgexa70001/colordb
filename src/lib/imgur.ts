const IMGUR_CLIENT_ID = 'b4f0a3b82615df1';

export const uploadToImgur = async (file: File): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch('https://api.imgur.com/3/image', {
      method: 'POST',
      headers: {
        Authorization: `Client-ID ${IMGUR_CLIENT_ID}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    const data = await response.json();
    if (!data.success || !data.data?.link) {
      throw new Error('Invalid response from Imgur');
    }

    const imageUrl = data.data.link.replace('http://', 'https://');
    return imageUrl;
  } catch (error) {
    console.error('Error uploading to Imgur:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to upload image');
  }
};
