import { useEffect, useState } from 'react';
import { getPexelsImages } from './images';

export const usePexelsImages = (query: string) => {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPexelsImages(query).then(data => {
      setImages(data);
      setLoading(false);
    });
  }, [query]);

  return { images, loading };
};
