"use server";

// ----------------- TMDB -----------------//

// episodes list by season
export async function getEpisodes(id: string, season: number) {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/tv/${id}/season/${season}?api_key=${process.env.TMDB_KEY}`
    );
    const data = await response.json();
    return data.episodes;
  } catch (error) {
    console.log(error);
  }
}

// search
export async function search(query: string) {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/search/multi?api_key=${process.env.TMDB_KEY}&query=${query}&include_adult=true&language=en-US&page=1`
    );
    const data = await response.json();
    // media_type: "tv" | "movie"
    const filteredData = data.results.filter(
      (item: any) => item.media_type === "tv" || item.media_type === "movie"
    );
    return filteredData;
  } catch (error) {
    console.log(error);
  }
}

// ----------------- 8stream -----------------//

// get stream url
export async function getStreamUrl(file: string, key: string) {
  try {
    // console.log("file", file);
    // console.log("key", key);
    const response = await fetch(`${process.env.STREAM_API}/getStream`, {
      cache: "no-cache",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        file,
        key,
      }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.log(error);
  }
}

// get Media info
export async function getMediaInfo(id: string) {
  try {
    const response = await fetch(
      `${process.env.STREAM_API}/mediaInfo?id=${id}`,
      { cache: "no-cache" }
    );
    const data = await response.json();
    // console.log("data", data);
    return data;
  } catch (error) {
    console.log(error);
  }
}

// play movie
export async function playMovie(id: string, lang: string) {
  try {
    const mediaInfo = await getMediaInfo(id);
    if (mediaInfo?.success) {
      const playlist = mediaInfo?.data?.playlist;
      let file = playlist.find((item: any) => item?.title === lang);
      if (!file) {
        file = playlist?.[0];
      }
      if (!file) {
        return { success: false, error: "No file found" };
      }
      const availableLang = playlist.map((item: any) => item?.title);
      const key = mediaInfo?.data?.key;
      const streamUrl = await getStreamUrl(file?.file, key);
      if (streamUrl?.success) {
        return { success: true, data: streamUrl?.data, availableLang };
      } else {
        return { success: false, error: "No stream url found" };
      }
    } else {
      return { success: false, error: "No media info found" };
    }
  } catch (error) {
    console.log(error);
    return { success: false, error };
  }
}

// play episode
export async function playEpisode(
  id: string,
  season: number,
  episode: number,
  lang: string
) {
  try {
    const mediaInfo = await getMediaInfo(id);
    if (!mediaInfo?.success) {
      return { success: false, error: "No media info found" };
    }
    const playlist = mediaInfo?.data?.playlist;
    const getSeason = playlist.find(
      (item: any) => item?.id === season.toString()
    );
    if (!getSeason) {
      return { success: false, error: "No season found" };
    }
    const getEpisode = getSeason?.folder.find(
      (item: any) => item?.episode === episode.toString()
    );
    if (!getEpisode) {
      return { success: false, error: "No episode found" };
    }
    let file = getEpisode?.folder.find((item: any) => item?.title === lang);
    if (!file) {
      file = getEpisode?.folder?.[0];
    }
    if (!file) {
      return { success: false, error: "No file found" };
    }
    const availableLang = getEpisode?.folder.map((item: any) => {
      return item?.title;
    });
    const filterLang = availableLang.filter((item: any) => item?.length > 0);
    const key = mediaInfo?.data?.key;
    const streamUrl = await getStreamUrl(file?.file, key);
    if (streamUrl?.success) {
      return {
        success: true,
        data: streamUrl?.data,
        availableLang: filterLang,
      };
    } else {
      return { success: false, error: "No stream url found" };
    }
  } catch (error) {
    console.log(error);
    return { success: false, error };
  }
}

// get season and episode and lang list
export async function getSeasonList(id: string) {
  try {
    const response = await fetch(
      `${process.env.STREAM_API}/getSeasonList?id=${id}`,
      {
        cache: "no-cache",
        headers: {
          'Accept': 'application/json'
        }
      }
    );

    // Check if response is ok
    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`);
      return { success: false, error: `HTTP error! status: ${response.status}` };
    }

    // Check content type
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.error("Received non-JSON response:", contentType);
      return { success: false, error: "Invalid response format" };
    }

    const data = await response.json();
    
    // Validate data structure
    if (!data || !Array.isArray(data?.data?.seasons)) {
      console.error("Invalid data structure received:", data);
      return { success: false, error: "Invalid data structure" };
    }

    return data;
  } catch (error) {
    console.error("Error fetching season list:", error);
    return { success: false, error: "Failed to fetch season list" };
  }
}

//Add this function to your existing API file

export async function getEpisodeInfo(tmdbId: string, seasonNumber: number, episodeNumber: number) {
  try {
    // Fetch episode details from TMDB
    const response = await fetch(
      `https://api.themoviedb.org/3/tv/${tmdbId}/season/${seasonNumber}/episode/${episodeNumber}?api_key=${process.env.NEXT_PUBLIC_TMDB_KEY}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch episode info');
    }
    
    const episodeData = await response.json();
    
    // Get the TV show details to extract the IMDB ID
    const showResponse = await fetch(
      `https://api.themoviedb.org/3/tv/${tmdbId}/external_ids?api_key=${process.env.NEXT_PUBLIC_TMDB_KEY}`
    );
    
    if (!showResponse.ok) {
      throw new Error('Failed to fetch show external IDs');
    }
    
    const externalIds = await showResponse.json();
    
    // Return combined data
    return {
      ...episodeData,
      imdbId: externalIds.imdb_id
    };
  } catch (error) {
    console.error('Error fetching episode info:', error);
    return {
      name: 'Episode not found',
      overview: 'Unable to load episode information',
      still_path: '',
      air_date: '',
      vote_average: 0,
      season_number: seasonNumber,
      episode_number: episodeNumber,
      imdbId: ''
    };
  }
}