'use client';
import axios from 'axios';
import { useState, useEffect } from 'react';

const useBackdrops = () => {
  const [backdrops, setBackdrops] = useState(null);

  useEffect(() => {
    const options = {
      method: 'GET',
      url: 'https://api.themoviedb.org/3/trending/all/week?language=en-US',
      headers: {
        accept: 'application/json',
        Authorization: process.env.NEXT_PUBLIC_MOVIEDB_API_KEY,
      },
    };
    const fetchBackdrops = async () => {
      try {
        const response = await axios
          .request(options)
          .then((res) =>
            res.data.results.map((x) => ({
              url: x.backdrop_path,
              i: x.id,
            }))
          )
          .catch((e) => console.log('fetch error: ', e));
        if (!response) {
          throw new Error('Failed to fetch');
        }
        setBackdrops(response);
      } catch (e) {
        console.error('Error: ', e);
      }
    };
    fetchBackdrops();
  }, []);
  return backdrops;
};

export default useBackdrops;
