// utils/getPexelsImages.ts
import axios from 'axios';

const PEXELS_API_KEY = 'ZycBDWef7ElEP18fafX6JfqlijqYwjuhfaNq69CwiJZQ43UgUfqTuMdO';

export const getPexelsImages = async (query: string = 'quiz question', count: number = 10) => {
  try {
    const response = await axios.get('https://api.pexels.com/v1/search', {
      headers: {
        Authorization: PEXELS_API_KEY
      },
      params: {
        query,
        per_page: count
      }
    });

    return response.data.photos.map((photo: any) => ({
      id: photo.id,
      url: photo.url,
      photographer: photo.photographer,
      src: photo.src.medium,
      full: photo.src.original
    }));
  } catch (error) {
    console.error("Pexels API xatosi:", error);
    return [];
  }
};
