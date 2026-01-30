const express = require('express');
const axios = require('axios');
const router = express.Router();

const API_BASE = process.env.API_URL || 'https://api.sansekai.my.id/api/melolo';

// Cache configuration
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const STREAM_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes for streams

// Helper function for caching with different durations
async function fetchWithCache(url, key, duration = CACHE_DURATION) {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < duration) {
        return cached.data;
    }

    try {
        const response = await axios.get(url, { 
            timeout: 10000,
            headers: {
                'User-Agent': 'DramaChina-App/1.0',
                'Accept': '*/*',
                'Referer': 'https://dramachina.com/'
            }
        });
        
        cache.set(key, {
            data: response.data,
            timestamp: Date.now()
        });
        
        return response.data;
    } catch (error) {
        console.error(`Error fetching ${url}:`, error.message);
        
        // Return cached data if available (even if expired)
        if (cached) {
            console.log('Using expired cache for:', key);
            return cached.data;
        }
        
        throw error;
    }
}

// Helper function to clean video ID
function cleanVideoId(videoId) {
    if (!videoId) return null;
    return videoId.toString().replace(/['"`]/g, '').trim();
}

// ==================== DRAMA ENDPOINTS ====================

// Latest dramas
router.get('/latest', async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;
        const cacheKey = `latest:${page}:${limit}`;
        
        const data = await fetchWithCache(`${API_BASE}/latest`, cacheKey);
        
        if (data && data.books) {
            const total = data.books.length;
            const paginatedBooks = data.books.slice(offset, offset + parseInt(limit));
            
            res.json({
                code: 0,
                message: 'success',
                data: {
                    books: paginatedBooks,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total,
                        totalPages: Math.ceil(total / limit),
                        hasNext: offset + parseInt(limit) < total,
                        hasPrev: offset > 0
                    }
                }
            });
        } else {
            res.json({
                code: 0,
                message: 'success',
                data: {
                    books: [],
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: 0,
                        totalPages: 0,
                        hasNext: false,
                        hasPrev: false
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error fetching latest dramas:', error);
        res.status(500).json({ 
            error: true, 
            code: 500,
            message: 'Failed to fetch latest dramas',
            details: error.message 
        });
    }
});

// Trending dramas
router.get('/trending', async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;
        const cacheKey = `trending:${page}:${limit}`;
        
        const data = await fetchWithCache(`${API_BASE}/trending`, cacheKey);
        
        if (data && data.books) {
            const total = data.books.length;
            const paginatedBooks = data.books.slice(offset, offset + parseInt(limit));
            
            res.json({
                code: 0,
                message: 'success',
                data: {
                    books: paginatedBooks,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total,
                        totalPages: Math.ceil(total / limit),
                        hasNext: offset + parseInt(limit) < total,
                        hasPrev: offset > 0
                    }
                }
            });
        } else {
            res.json({
                code: 0,
                message: 'success',
                data: {
                    books: [],
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: 0,
                        totalPages: 0,
                        hasNext: false,
                        hasPrev: false
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error fetching trending dramas:', error);
        res.status(500).json({ 
            error: true, 
            code: 500,
            message: 'Failed to fetch trending dramas',
            details: error.message 
        });
    }
});

// Search dramas
router.get('/search', async (req, res) => {
    const { query, page = 1, limit = 20 } = req.query;
    
    if (!query || query.trim().length < 2) {
        return res.status(400).json({ 
            error: true, 
            code: 400,
            message: 'Search query must be at least 2 characters long' 
        });
    }

    try {
        const encodedQuery = encodeURIComponent(query.trim());
        const offset = (page - 1) * limit;
        const cacheKey = `search:${encodedQuery}:${page}:${limit}`;
        
        const data = await fetchWithCache(
            `${API_BASE}/search?query=${encodedQuery}&limit=${limit}&offset=${offset}`,
            cacheKey
        );
        
        if (data && data.code === 0 && data.data && data.data.search_data) {
            let allBooks = [];
            data.data.search_data.forEach(item => {
                if (item.books && item.books.length > 0) {
                    allBooks.push(...item.books);
                }
            });
            
            // Remove duplicates by book_id
            const uniqueBooks = Array.from(
                new Map(allBooks.map(book => [book.book_id, book])).values()
            );
            
            const total = uniqueBooks.length;
            const paginatedBooks = uniqueBooks.slice(0, parseInt(limit));
            
            res.json({
                code: 0,
                message: 'success',
                data: {
                    query: query,
                    books: paginatedBooks,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total,
                        totalPages: Math.ceil(total / limit),
                        hasNext: parseInt(limit) < total,
                        hasPrev: parseInt(page) > 1
                    }
                }
            });
        } else {
            res.json({
                code: 0,
                message: 'success',
                data: {
                    query: query,
                    books: [],
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: 0,
                        totalPages: 0,
                        hasNext: false,
                        hasPrev: false
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error searching dramas:', error);
        res.status(500).json({ 
            error: true, 
            code: 500,
            message: 'Failed to search dramas',
            details: error.message 
        });
    }
});

// Drama detail by book ID
router.get('/detail/:bookId', async (req, res) => {
    try {
        const { bookId } = req.params;
        
        if (!bookId) {
            return res.status(400).json({ 
                error: true, 
                code: 400,
                message: 'Book ID is required' 
            });
        }

        const cleanBookId = cleanVideoId(bookId);
        const cacheKey = `detail:${cleanBookId}`;
        
        const data = await fetchWithCache(
            `${API_BASE}/detail?bookId=${cleanBookId}`,
            cacheKey
        );
        
        if (data && data.code === 0 && data.data) {
            // Enrich the data with additional information
            const enrichedData = enrichDramaDetail(data.data);
            res.json({
                code: 0,
                message: 'success',
                data: enrichedData
            });
        } else {
            res.status(404).json({ 
                error: true, 
                code: 404,
                message: 'Drama not found',
                details: data ? data.message : 'No data returned'
            });
        }
    } catch (error) {
        console.error('Error fetching drama detail:', error);
        
        // Check for specific error codes
        if (error.response && error.response.data && error.response.data.code === 100001) {
            return res.status(400).json({
                error: true,
                code: 100001,
                message: 'Invalid book ID parameter',
                details: 'The book ID format is incorrect or invalid'
            });
        }
        
        res.status(500).json({ 
            error: true, 
            code: 500,
            message: 'Failed to fetch drama details',
            details: error.message 
        });
    }
});

// ==================== VIDEO STREAM ENDPOINTS ====================

// Get basic video stream
router.get('/stream/:videoId', async (req, res) => {
    try {
        const { videoId } = req.params;
        
        if (!videoId) {
            return res.status(400).json({ 
                error: true, 
                code: 400,
                message: 'Video ID is required' 
            });
        }

        const cleanVideoIdStr = cleanVideoId(videoId);
        const cacheKey = `stream:${cleanVideoIdStr}`;
        
        const data = await fetchWithCache(
            `${API_BASE}/stream?videoId=${cleanVideoIdStr}`,
            cacheKey,
            STREAM_CACHE_DURATION
        );
        
        if (data && data.code === 0 && data.data) {
            // Decode base64 URLs if present
            const processedData = processStreamData(data.data);
            res.json({
                code: 0,
                message: 'success',
                data: processedData
            });
        } else {
            res.status(404).json({ 
                error: true, 
                code: 404,
                message: 'Video stream not found',
                details: data ? data.message : 'No stream data available'
            });
        }
    } catch (error) {
        console.error('Error fetching stream:', error.message);
        
        // Check for invalid parameter error
        if (error.response && error.response.data && error.response.data.code === 100001) {
            return res.status(400).json({
                error: true,
                code: 100001,
                message: 'Invalid video ID parameter',
                details: 'The video ID format is incorrect or invalid'
            });
        }
        
        res.status(500).json({ 
            error: true, 
            code: 500,
            message: 'Failed to fetch video stream',
            details: error.message 
        });
    }
});

// Get video stream with quality options
router.get('/stream/quality/:videoId', async (req, res) => {
    try {
        const { videoId } = req.params;
        const { quality = 'auto' } = req.query;
        
        if (!videoId) {
            return res.status(400).json({ 
                error: true, 
                code: 400,
                message: 'Video ID is required' 
            });
        }

        const cleanVideoIdStr = cleanVideoId(videoId);
        const cacheKey = `stream:quality:${cleanVideoIdStr}:${quality}`;
        
        const data = await fetchWithCache(
            `${API_BASE}/stream?videoId=${cleanVideoIdStr}`,
            `stream:${cleanVideoIdStr}`,
            STREAM_CACHE_DURATION
        );
        
        if (data && data.code === 0 && data.data) {
            const processedData = processStreamData(data.data);
            const qualityOptions = extractQualityOptions(data.data);
            
            const responseData = {
                ...processedData,
                quality_options: qualityOptions,
                selected_quality: quality,
                available_qualities: Object.keys(qualityOptions)
            };
            
            // If specific quality requested, return that URL
            if (quality !== 'auto' && qualityOptions[quality]) {
                responseData.selected_url = qualityOptions[quality].main_url;
                responseData.selected_backup = qualityOptions[quality].backup_url;
            }
            
            res.json({
                code: 0,
                message: 'success',
                data: responseData
            });
        } else {
            res.status(404).json({ 
                error: true, 
                code: 404,
                message: 'Video stream not found'
            });
        }
    } catch (error) {
        console.error('Error fetching stream quality:', error);
        res.status(500).json({ 
            error: true, 
            code: 500,
            message: 'Failed to fetch video stream with quality options',
            details: error.message 
        });
    }
});

// Get video playback information
router.get('/playback/:videoId', async (req, res) => {
    try {
        const { videoId } = req.params;
        
        if (!videoId) {
            return res.status(400).json({ 
                error: true, 
                code: 400,
                message: 'Video ID is required' 
            });
        }

        const cleanVideoIdStr = cleanVideoId(videoId);
        const cacheKey = `playback:${cleanVideoIdStr}`;
        
        const data = await fetchWithCache(
            `${API_BASE}/stream?videoId=${cleanVideoIdStr}`,
            `stream:${cleanVideoIdStr}`,
            STREAM_CACHE_DURATION
        );
        
        if (data && data.code === 0 && data.data) {
            const playbackInfo = {
                video_id: cleanVideoIdStr,
                stream_available: true,
                expires_at: data.data.expire_time ? 
                    new Date(data.data.expire_time * 1000).toISOString() : null,
                expires_in_seconds: data.data.expire_time ? 
                    Math.floor((data.data.expire_time * 1000 - Date.now()) / 1000) : null,
                video_resolution: {
                    width: data.data.video_width,
                    height: data.data.video_height
                },
                main_url: data.data.main_url,
                backup_url: data.data.backup_url
            };
            
            try {
                if (data.data.video_model) {
                    const videoModel = JSON.parse(data.data.video_model);
                    playbackInfo.video_duration = videoModel.video_duration;
                    playbackInfo.poster_url = videoModel.poster_url;
                    playbackInfo.has_embedded_subtitle = videoModel.has_embedded_subtitle;
                    
                    if (videoModel.video_list) {
                        const qualities = Object.keys(videoModel.video_list).map(key => {
                            const video = videoModel.video_list[key];
                            return {
                                id: key,
                                definition: video.definition,
                                quality: video.quality,
                                resolution: `${video.vwidth}x${video.vheight}`,
                                bitrate: video.bitrate,
                                size_bytes: video.size,
                                size_mb: (video.size / (1024 * 1024)).toFixed(2),
                                codec: video.codec_type,
                                fps: video.fps,
                                url_expire: video.url_expire ? 
                                    new Date(video.url_expire * 1000).toISOString() : null
                            };
                        });
                        
                        playbackInfo.available_qualities = qualities;
                        playbackInfo.recommended_quality = videoModel.auto_definition;
                        playbackInfo.video_duration_formatted = 
                            formatDuration(videoModel.video_duration);
                    }
                }
            } catch (e) {
                console.error('Error parsing video model:', e);
                playbackInfo.video_model_error = e.message;
            }
            
            res.json({
                code: 0,
                message: 'success',
                data: playbackInfo
            });
        } else {
            res.status(404).json({
                code: 404,
                message: 'Video stream not available',
                data: {
                    video_id: cleanVideoIdStr,
                    stream_available: false,
                    error: data ? data.message : 'Unknown error'
                }
            });
        }
    } catch (error) {
        console.error('Error fetching playback info:', error);
        res.status(500).json({ 
            error: true, 
            code: 500,
            message: 'Failed to fetch playback information',
            details: error.message 
        });
    }
});

// ==================== EPISODE ENDPOINTS ====================

// Get episodes by drama ID
router.get('/episodes/:bookId', async (req, res) => {
    try {
        const { bookId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        
        if (!bookId) {
            return res.status(400).json({ 
                error: true, 
                code: 400,
                message: 'Book ID is required' 
            });
        }

        const cleanBookId = cleanVideoId(bookId);
        const cacheKey = `episodes:${cleanBookId}:${page}:${limit}`;
        
        // First get drama detail to extract episodes
        const detailData = await fetchWithCache(
            `${API_BASE}/detail?bookId=${cleanBookId}`,
            `detail:${cleanBookId}`
        );
        
        if (detailData && detailData.code === 0 && detailData.data && 
            detailData.data.video_data && detailData.data.video_data.video_list) {
            
            const episodes = detailData.data.video_data.video_list;
            const total = episodes.length;
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + parseInt(limit);
            const paginatedEpisodes = episodes.slice(startIndex, endIndex);
            
            // Enrich episode data with additional information
            const enrichedEpisodes = paginatedEpisodes.map(episode => ({
                ...episode,
                episode_number: episode.vid_index,
                duration_formatted: formatDuration(episode.duration || 0),
                likes_formatted: episode.digged_count ? 
                    episode.digged_count.toLocaleString() : '0',
                has_disclaimer: !!episode.disclaimer_info,
                disclaimer_content: episode.disclaimer_info?.content
            }));
            
            res.json({
                code: 0,
                message: 'success',
                data: {
                    drama_id: cleanBookId,
                    drama_title: detailData.data.video_data.series_title,
                    total_episodes: total,
                    episodes: enrichedEpisodes,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total,
                        totalPages: Math.ceil(total / limit),
                        hasNext: endIndex < total,
                        hasPrev: startIndex > 0
                    }
                }
            });
        } else {
            res.status(404).json({ 
                error: true, 
                code: 404,
                message: 'Drama not found or no episodes available'
            });
        }
    } catch (error) {
        console.error('Error fetching episodes:', error);
        res.status(500).json({ 
            error: true, 
            code: 500,
            message: 'Failed to fetch drama episodes',
            details: error.message 
        });
    }
});

// Get specific episode by number
router.get('/episodes/:bookId/:episodeNumber', async (req, res) => {
    try {
        const { bookId, episodeNumber } = req.params;
        
        if (!bookId || !episodeNumber) {
            return res.status(400).json({ 
                error: true, 
                code: 400,
                message: 'Book ID and Episode Number are required' 
            });
        }

        const cleanBookId = cleanVideoId(bookId);
        const episodeNum = parseInt(episodeNumber);
        
        // Get all episodes
        const detailData = await fetchWithCache(
            `${API_BASE}/detail?bookId=${cleanBookId}`,
            `detail:${cleanBookId}`
        );
        
        if (detailData && detailData.code === 0 && detailData.data && 
            detailData.data.video_data && detailData.data.video_data.video_list) {
            
            const episodes = detailData.data.video_data.video_list;
            const episode = episodes.find(ep => ep.vid_index === episodeNum);
            
            if (episode) {
                // Get stream data for this episode
                let streamData = null;
                try {
                    const streamResponse = await fetchWithCache(
                        `${API_BASE}/stream?videoId=${episode.vid}`,
                        `stream:${episode.vid}`,
                        STREAM_CACHE_DURATION
                    );
                    
                    if (streamResponse && streamResponse.code === 0 && streamResponse.data) {
                        streamData = processStreamData(streamResponse.data);
                    }
                } catch (streamError) {
                    console.error('Error fetching stream for episode:', streamError);
                }
                
                const enrichedEpisode = {
                    ...episode,
                    episode_number: episode.vid_index,
                    duration_formatted: formatDuration(episode.duration || 0),
                    likes_formatted: episode.digged_count ? 
                        episode.digged_count.toLocaleString() : '0',
                    has_disclaimer: !!episode.disclaimer_info,
                    disclaimer_content: episode.disclaimer_info?.content,
                    stream_available: !!streamData,
                    stream_data: streamData,
                    next_episode: episodeNum < episodes.length ? episodeNum + 1 : null,
                    prev_episode: episodeNum > 1 ? episodeNum - 1 : null,
                    total_episodes: episodes.length,
                    drama_info: {
                        id: cleanBookId,
                        title: detailData.data.video_data.series_title,
                        cover: detailData.data.video_data.series_cover,
                        description: detailData.data.video_data.series_intro
                    }
                };
                
                res.json({
                    code: 0,
                    message: 'success',
                    data: enrichedEpisode
                });
            } else {
                res.status(404).json({ 
                    error: true, 
                    code: 404,
                    message: `Episode ${episodeNumber} not found`
                });
            }
        } else {
            res.status(404).json({ 
                error: true, 
                code: 404,
                message: 'Drama not found'
            });
        }
    } catch (error) {
        console.error('Error fetching episode:', error);
        res.status(500).json({ 
            error: true, 
            code: 500,
            message: 'Failed to fetch episode',
            details: error.message 
        });
    }
});

// ==================== CATEGORY & FILTER ENDPOINTS ====================

// Get drama categories
router.get('/categories', async (req, res) => {
    try {
        // Since the API doesn't have a categories endpoint,
        // we'll extract categories from trending dramas
        const cacheKey = 'categories';
        
        const data = await fetchWithCache(`${API_BASE}/trending`, 'trending');
        
        if (data && data.books) {
            const categories = new Set();
            
            data.books.forEach(book => {
                if (book.stat_infos && Array.isArray(book.stat_infos)) {
                    book.stat_infos.forEach(category => {
                        if (category.trim()) {
                            categories.add(category.trim());
                        }
                    });
                }
            });
            
            // Add common categories
            const commonCategories = [
                'Romance',
                'Drama', 
                'Fantasy',
                'Action',
                'Comedy',
                'Historical',
                'Modern',
                'Family',
                'School',
                'Supernatural'
            ];
            
            commonCategories.forEach(cat => categories.add(cat));
            
            const categoriesArray = Array.from(categories).sort();
            const categorized = categoriesArray.map((cat, index) => ({
                id: index + 1,
                name: cat,
                slug: cat.toLowerCase().replace(/\s+/g, '-'),
                count: data.books.filter(book => 
                    book.stat_infos && book.stat_infos.includes(cat)
                ).length
            }));
            
            res.json({
                code: 0,
                message: 'success',
                data: {
                    categories: categorized,
                    total: categorized.length
                }
            });
        } else {
            res.json({
                code: 0,
                message: 'success',
                data: {
                    categories: [],
                    total: 0
                }
            });
        }
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ 
            error: true, 
            code: 500,
            message: 'Failed to fetch categories',
            details: error.message 
        });
    }
});

// Get dramas by category
router.get('/category/:categoryName', async (req, res) => {
    try {
        const { categoryName } = req.params;
        const { page = 1, limit = 20 } = req.query;
        
        if (!categoryName) {
            return res.status(400).json({ 
                error: true, 
                code: 400,
                message: 'Category name is required' 
            });
        }

        // Search for dramas with this category
        const encodedCategory = encodeURIComponent(categoryName);
        const offset = (page - 1) * limit;
        const cacheKey = `category:${categoryName}:${page}:${limit}`;
        
        const data = await fetchWithCache(
            `${API_BASE}/search?query=${encodedCategory}&limit=${limit}&offset=${offset}`,
            cacheKey
        );
        
        if (data && data.code === 0 && data.data && data.data.search_data) {
            let filteredBooks = [];
            data.data.search_data.forEach(item => {
                if (item.books && item.books.length > 0) {
                    // Filter books that have this category in stat_infos
                    const categoryBooks = item.books.filter(book => 
                        book.stat_infos && 
                        book.stat_infos.some(info => 
                            info.toLowerCase().includes(categoryName.toLowerCase())
                        )
                    );
                    filteredBooks.push(...categoryBooks);
                }
            });
            
            // Remove duplicates
            const uniqueBooks = Array.from(
                new Map(filteredBooks.map(book => [book.book_id, book])).values()
            );
            
            const total = uniqueBooks.length;
            const paginatedBooks = uniqueBooks.slice(0, parseInt(limit));
            
            res.json({
                code: 0,
                message: 'success',
                data: {
                    category: categoryName,
                    books: paginatedBooks,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total,
                        totalPages: Math.ceil(total / limit),
                        hasNext: parseInt(limit) < total,
                        hasPrev: parseInt(page) > 1
                    }
                }
            });
        } else {
            res.json({
                code: 0,
                message: 'success',
                data: {
                    category: categoryName,
                    books: [],
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: 0,
                        totalPages: 0,
                        hasNext: false,
                        hasPrev: false
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error fetching category dramas:', error);
        res.status(500).json({ 
            error: true, 
            code: 500,
            message: 'Failed to fetch category dramas',
            details: error.message 
        });
    }
});

// ==================== RECOMMENDATION ENDPOINTS ====================

// Get similar dramas
router.get('/similar/:bookId', async (req, res) => {
    try {
        const { bookId } = req.params;
        const { limit = 6 } = req.query;
        
        if (!bookId) {
            return res.status(400).json({ 
                error: true, 
                code: 400,
                message: 'Book ID is required' 
            });
        }

        const cleanBookId = cleanVideoId(bookId);
        
        // Get the drama details to extract categories
        const detailData = await fetchWithCache(
            `${API_BASE}/detail?bookId=${cleanBookId}`,
            `detail:${cleanBookId}`
        );
        
        if (!detailData || detailData.code !== 0 || !detailData.data || !detailData.data.video_data) {
            return res.status(404).json({ 
                error: true, 
                code: 404,
                message: 'Drama not found'
            });
        }

        const videoData = detailData.data.video_data;
        let categories = [];
        
        // Extract categories from category_schema
        try {
            if (videoData.category_schema) {
                const parsedCategories = JSON.parse(videoData.category_schema);
                categories = parsedCategories.map(cat => cat.name);
            }
        } catch (e) {
            console.error('Error parsing categories:', e);
            // Fallback to stat_infos if available
            if (detailData.data.stat_infos) {
                categories = detailData.data.stat_infos;
            }
        }

        // If no categories, return popular dramas as fallback
        if (categories.length === 0) {
            const trendingData = await fetchWithCache(`${API_BASE}/trending`, 'trending');
            if (trendingData && trendingData.books) {
                const similar = trendingData.books
                    .filter(book => book.book_id.toString() !== cleanBookId)
                    .slice(0, parseInt(limit));
                
                return res.json({
                    code: 0,
                    message: 'success',
                    data: {
                        similar: similar,
                        total: similar.length,
                        based_on: 'popular_dramas',
                        original_drama: {
                            id: cleanBookId,
                            title: videoData.series_title
                        }
                    }
                });
            }
        }

        // Search for dramas with similar categories
        const searchPromises = categories.slice(0, 3).map(category =>
            fetchWithCache(
                `${API_BASE}/search?query=${encodeURIComponent(category)}&limit=5&offset=0`,
                `search_similar:${category}`
            ).catch(() => null)
        );

        const searchResults = await Promise.all(searchPromises);
        const similarDramas = new Map();
        
        searchResults.forEach(result => {
            if (result && result.code === 0 && result.data && result.data.search_data) {
                result.data.search_data.forEach(item => {
                    if (item.books && item.books.length > 0) {
                        item.books.forEach(book => {
                            // Exclude the current drama
                            if (book.book_id.toString() !== cleanBookId) {
                                // Calculate relevance score based on category matches
                                let score = 0;
                                if (book.stat_infos) {
                                    const commonCategories = book.stat_infos.filter(cat => 
                                        categories.includes(cat)
                                    ).length;
                                    score = commonCategories * 10;
                                }
                                
                                // Add hot bonus
                                if (book.is_hot === "1") score += 5;
                                
                                similarDramas.set(book.book_id, {
                                    ...book,
                                    relevance_score: score,
                                    matching_categories: book.stat_infos ? 
                                        book.stat_infos.filter(cat => categories.includes(cat)) : []
                                });
                            }
                        });
                    }
                });
            }
        });

        // Convert map to array, sort by relevance, and limit results
        const similarArray = Array.from(similarDramas.values())
            .sort((a, b) => b.relevance_score - a.relevance_score)
            .slice(0, parseInt(limit));

        res.json({
            code: 0,
            message: 'success',
            data: {
                similar: similarArray,
                total: similarArray.length,
                based_on_categories: categories,
                original_drama: {
                    id: cleanBookId,
                    title: videoData.series_title,
                    categories: categories
                }
            }
        });
    } catch (error) {
        console.error('Error fetching similar dramas:', error);
        res.status(500).json({ 
            error: true, 
            code: 500,
            message: 'Failed to fetch similar dramas',
            details: error.message 
        });
    }
});

// Get recommended dramas (based on popularity and recency)
router.get('/recommended', async (req, res) => {
    try {
        const { limit = 12 } = req.query;
        
        // Get both trending and latest dramas
        const [trendingData, latestData] = await Promise.all([
            fetchWithCache(`${API_BASE}/trending`, 'trending'),
            fetchWithCache(`${API_BASE}/latest`, 'latest')
        ]);
        
        let allDramas = [];
        
        if (trendingData && trendingData.books) {
            allDramas.push(...trendingData.books.map(book => ({
                ...book,
                recommendation_source: 'trending',
                recommendation_score: 80 // Higher score for trending
            })));
        }
        
        if (latestData && latestData.books) {
            latestData.books.forEach(book => {
                // Check if already in list
                const existingIndex = allDramas.findIndex(b => b.book_id === book.book_id);
                if (existingIndex === -1) {
                    allDramas.push({
                        ...book,
                        recommendation_source: 'latest',
                        recommendation_score: 70 // Lower score for latest
                    });
                }
            });
        }
        
        // Add hot dramas bonus
        allDramas = allDramas.map(book => {
            if (book.is_hot === "1") {
                return {
                    ...book,
                    recommendation_score: book.recommendation_score + 15
                };
            }
            return book;
        });
        
        // Sort by recommendation score and limit
        const recommended = allDramas
            .sort((a, b) => b.recommendation_score - a.recommendation_score)
            .slice(0, parseInt(limit));
        
        res.json({
            code: 0,
            message: 'success',
            data: {
                recommended: recommended,
                total: recommended.length,
                sources: ['trending', 'latest']
            }
        });
    } catch (error) {
        console.error('Error fetching recommended dramas:', error);
        res.status(500).json({ 
            error: true, 
            code: 500,
            message: 'Failed to fetch recommended dramas',
            details: error.message 
        });
    }
});

// ==================== UTILITY ENDPOINTS ====================

// Validate video ID
router.get('/validate/:videoId', async (req, res) => {
    try {
        const { videoId } = req.params;
        
        if (!videoId) {
            return res.status(400).json({ 
                error: true, 
                code: 400,
                message: 'Video ID is required' 
            });
        }

        const cleanVideoIdStr = cleanVideoId(videoId);
        
        // Basic validation
        const isValidNumeric = /^\d+$/.test(cleanVideoIdStr);
        const isValidLength = cleanVideoIdStr.length >= 10 && cleanVideoIdStr.length <= 20;
        
        if (!isValidNumeric) {
            return res.json({
                code: 100001,
                message: 'Invalid video ID format',
                data: {
                    valid: false,
                    video_id: cleanVideoIdStr,
                    reason: 'Video ID should contain only numbers',
                    suggestions: [
                        'Remove any quotes or special characters',
                        'Ensure the ID contains only digits',
                        'Check the video ID format'
                    ]
                }
            });
        }
        
        if (!isValidLength) {
            return res.json({
                code: 100001,
                message: 'Invalid video ID length',
                data: {
                    valid: false,
                    video_id: cleanVideoIdStr,
                    reason: `Video ID length ${cleanVideoIdStr.length} is not within expected range (10-20)`,
                    suggestions: [
                        'Verify the video ID is complete',
                        'Check for missing digits',
                        'Ensure no extra characters are included'
                    ]
                }
            });
        }
        
        // Try to fetch stream to validate it actually exists
        try {
            await fetchWithCache(
                `${API_BASE}/stream?videoId=${cleanVideoIdStr}`,
                `validate:${cleanVideoIdStr}`,
                STREAM_CACHE_DURATION
            );
            
            res.json({
                code: 0,
                message: 'Video ID is valid',
                data: {
                    valid: true,
                    video_id: cleanVideoIdStr,
                    format: 'numeric',
                    length: cleanVideoIdStr.length,
                    validation_timestamp: new Date().toISOString()
                }
            });
        } catch (streamError) {
            if (streamError.response && streamError.response.data && streamError.response.data.code === 100001) {
                res.json({
                    code: 100001,
                    message: 'Video ID not found',
                    data: {
                        valid: false,
                        video_id: cleanVideoIdStr,
                        reason: 'The video ID does not exist or is not accessible',
                        suggestions: [
                            'Check if the video ID is correct',
                            'Verify the video still exists',
                            'Try a different video ID'
                        ]
                    }
                });
            } else {
                throw streamError;
            }
        }
    } catch (error) {
        console.error('Error validating video ID:', error);
        res.status(500).json({ 
            error: true, 
            code: 500,
            message: 'Failed to validate video ID',
            details: error.message 
        });
    }
});

// Get subtitles for video
router.get('/subtitles/:videoId', async (req, res) => {
    try {
        const { videoId } = req.params;
        
        if (!videoId) {
            return res.status(400).json({ 
                error: true, 
                code: 400,
                message: 'Video ID is required' 
            });
        }

        const cleanVideoIdStr = cleanVideoId(videoId);
        
        // Get stream data to check for subtitles
        const streamData = await fetchWithCache(
            `${API_BASE}/stream?videoId=${cleanVideoIdStr}`,
            `stream:${cleanVideoIdStr}`,
            STREAM_CACHE_DURATION
        );
        
        if (streamData && streamData.code === 0 && streamData.data) {
            let subtitles = [];
            let hasEmbeddedSubtitle = false;
            
            try {
                const videoModel = JSON.parse(streamData.data.video_model);
                hasEmbeddedSubtitle = videoModel.has_embedded_subtitle || false;
                
                if (hasEmbeddedSubtitle) {
                    // In a real implementation, you would fetch actual subtitle URLs
                    subtitles = [
                        {
                            id: 'id',
                            language: 'Bahasa Indonesia',
                            language_code: 'id',
                            url: null,
                            format: 'vtt',
                            is_default: true,
                            is_embedded: true
                        },
                        {
                            id: 'en',
                            language: 'English',
                            language_code: 'en',
                            url: null,
                            format: 'vtt',
                            is_default: false,
                            is_embedded: true
                        }
                    ];
                }
            } catch (e) {
                console.error('Error checking subtitles:', e);
            }
            
            res.json({
                code: 0,
                message: 'success',
                data: {
                    video_id: cleanVideoIdStr,
                    available: subtitles.length > 0,
                    has_embedded_subtitle: hasEmbeddedSubtitle,
                    subtitles: subtitles,
                    total: subtitles.length
                }
            });
        } else {
            res.json({
                code: 0,
                message: 'success',
                data: {
                    video_id: cleanVideoIdStr,
                    available: false,
                    has_embedded_subtitle: false,
                    subtitles: [],
                    total: 0
                }
            });
        }
    } catch (error) {
        console.error('Error fetching subtitles:', error);
        res.status(500).json({ 
            error: true, 
            code: 500,
            message: 'Failed to fetch subtitles',
            details: error.message 
        });
    }
});

// Batch get multiple streams
router.post('/batch/streams', async (req, res) => {
    try {
        const { videoIds } = req.body;
        
        if (!videoIds || !Array.isArray(videoIds) || videoIds.length === 0) {
            return res.status(400).json({ 
                error: true, 
                code: 400,
                message: 'Array of video IDs is required' 
            });
        }

        if (videoIds.length > 10) {
            return res.status(400).json({ 
                error: true, 
                code: 400,
                message: 'Maximum 10 video IDs allowed per request' 
            });
        }

        const results = {};
        const errors = [];
        
        // Process each video ID
        const promises = videoIds.map(async (videoId) => {
            try {
                const cleanVideoIdStr = cleanVideoId(videoId);
                
                const data = await fetchWithCache(
                    `${API_BASE}/stream?videoId=${cleanVideoIdStr}`,
                    `stream:${cleanVideoIdStr}`,
                    STREAM_CACHE_DURATION
                );
                
                if (data && data.code === 0 && data.data) {
                    results[cleanVideoIdStr] = {
                        success: true,
                        stream_available: true,
                        main_url: data.data.main_url,
                        backup_url: data.data.backup_url,
                        width: data.data.video_width,
                        height: data.data.video_height,
                        expires_at: data.data.expire_time ? 
                            new Date(data.data.expire_time * 1000).toISOString() : null
                    };
                } else {
                    results[videoId] = {
                        success: false,
                        error: data ? data.message : 'Unknown error'
                    };
                    errors.push(videoId);
                }
            } catch (error) {
                results[videoId] = {
                    success: false,
                    error: error.message
                };
                errors.push(videoId);
            }
        });
        
        await Promise.all(promises);
        
        res.json({
            code: 0,
            message: 'Batch stream results',
            data: {
                total_requested: videoIds.length,
                successful: videoIds.length - errors.length,
                failed: errors.length,
                failed_ids: errors,
                streams: results,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error fetching batch streams:', error);
        res.status(500).json({ 
            error: true, 
            code: 500,
            message: 'Failed to fetch batch streams',
            details: error.message 
        });
    }
});

// ==================== SYSTEM ENDPOINTS ====================

// Health check
router.get('/health', (req, res) => {
    const health = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cache_stats: {
            total_items: cache.size,
            memory_usage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB'
        },
        environment: process.env.NODE_ENV || 'development'
    };
    
    res.json(health);
});

// Cache stats (development only)
router.get('/cache/stats', (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ 
            error: true, 
            code: 403,
            message: 'Cache stats not available in production' 
        });
    }
    
    const stats = {
        total_items: cache.size,
        items: Array.from(cache.entries()).map(([key, value]) => ({
            key: key.substring(0, 50) + (key.length > 50 ? '...' : ''),
            timestamp: new Date(value.timestamp).toISOString(),
            age_seconds: Math.round((Date.now() - value.timestamp) / 1000),
            data_type: typeof value.data,
            has_data: !!value.data
        }))
    };
    
    res.json(stats);
});

// Clear cache (development only)
router.post('/cache/clear', (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ 
            error: true, 
            code: 403,
            message: 'Cache clearing not allowed in production' 
        });
    }
    
    const cacheSize = cache.size;
    cache.clear();
    
    res.json({ 
        success: true, 
        message: `Cache cleared (${cacheSize} items removed)`,
        timestamp: new Date().toISOString()
    });
});

// Clear specific cache key
router.post('/cache/clear/:key', (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ 
            error: true, 
            code: 403,
            message: 'Cache clearing not allowed in production' 
        });
    }
    
    const { key } = req.params;
    const wasDeleted = cache.delete(key);
    
    res.json({ 
        success: true, 
        deleted: wasDeleted,
        key: key,
        message: wasDeleted ? 'Cache key cleared' : 'Cache key not found'
    });
});

// ==================== HELPER FUNCTIONS ====================

// Process stream data
function processStreamData(streamData) {
    if (!streamData) return null;
    
    const processed = { ...streamData };
    
    // Decode base64 URLs in video_model if present
    if (streamData.video_model) {
        try {
            const videoModel = JSON.parse(streamData.video_model);
            
            if (videoModel.video_list) {
                Object.keys(videoModel.video_list).forEach(key => {
                    const video = videoModel.video_list[key];
                    
                    // Decode base64 URLs
                    if (video.main_url && video.main_url.startsWith('aHR0c')) {
                        try {
                            video.main_url = Buffer.from(video.main_url, 'base64').toString();
                        } catch (e) {
                            console.error('Error decoding main_url:', e);
                        }
                    }
                    
                    if (video.backup_url_1 && video.backup_url_1.startsWith('aHR0c')) {
                        try {
                            video.backup_url_1 = Buffer.from(video.backup_url_1, 'base64').toString();
                        } catch (e) {
                            console.error('Error decoding backup_url_1:', e);
                        }
                    }
                });
                
                processed.video_model = JSON.stringify(videoModel);
            }
        } catch (e) {
            console.error('Error processing video model:', e);
        }
    }
    
    return processed;
}

// Extract quality options from stream data
function extractQualityOptions(streamData) {
    const qualityOptions = {};
    
    if (!streamData.video_model) return qualityOptions;
    
    try {
        const videoModel = JSON.parse(streamData.video_model);
        
        if (videoModel.video_list) {
            Object.keys(videoModel.video_list).forEach(key => {
                const video = videoModel.video_list[key];
                
                // Decode URLs
                let mainUrl = video.main_url;
                let backupUrl = video.backup_url_1;
                
                if (mainUrl && mainUrl.startsWith('aHR0c')) {
                    try {
                        mainUrl = Buffer.from(mainUrl, 'base64').toString();
                    } catch (e) {
                        console.error('Error decoding URL:', e);
                    }
                }
                
                if (backupUrl && backupUrl.startsWith('aHR0c')) {
                    try {
                        backupUrl = Buffer.from(backupUrl, 'base64').toString();
                    } catch (e) {
                        console.error('Error decoding backup URL:', e);
                    }
                }
                
                qualityOptions[video.definition] = {
                    definition: video.definition,
                    quality: video.quality,
                    vwidth: video.vwidth,
                    vheight: video.vheight,
                    bitrate: video.bitrate,
                    size: video.size,
                    size_mb: (video.size / (1024 * 1024)).toFixed(2),
                    main_url: mainUrl,
                    backup_url: backupUrl,
                    codec_type: video.codec_type,
                    fps: video.fps,
                    url_expire: video.url_expire,
                    file_hash: video.file_hash
                };
            });
        }
    } catch (e) {
        console.error('Error extracting quality options:', e);
    }
    
    return qualityOptions;
}

// Enrich drama detail data
function enrichDramaDetail(detailData) {
    if (!detailData) return null;
    
    const enriched = { ...detailData };
    
    // Parse category schema
    if (detailData.video_data && detailData.video_data.category_schema) {
        try {
            const categories = JSON.parse(detailData.video_data.category_schema);
            enriched.video_data.categories_parsed = categories.map(cat => ({
                id: cat.category_id,
                name: cat.name,
                schema: cat.schema
            }));
        } catch (e) {
            console.error('Error parsing category schema:', e);
            enriched.video_data.categories_parsed = [];
        }
    }
    
    // Format episode list
    if (detailData.video_data && detailData.video_data.video_list) {
        enriched.video_data.episodes_enriched = detailData.video_data.video_list.map(episode => ({
            ...episode,
            episode_number: episode.vid_index,
            duration_formatted: formatDuration(episode.duration || 0),
            likes_formatted: episode.digged_count ? 
                episode.digged_count.toLocaleString() : '0',
            has_disclaimer: !!episode.disclaimer_info,
            disclaimer_content: episode.disclaimer_info?.content
        }));
    }
    
    // Add metadata
    enriched.metadata = {
        total_episodes: detailData.video_data?.episode_cnt || 0,
        follower_count: detailData.video_data?.followed_cnt || 0,
        play_count: detailData.video_data?.series_play_cnt || 0,
        age_rating: detailData.video_data?.age_gate_info?.age_gate || 18,
        status: detailData.video_data?.series_status === 1 ? 'ongoing' : 'completed',
        can_download: detailData.video_data?.download_config?.can_download || false,
        share_count: detailData.video_data?.share_info?.share_cnt || 0
    };
    
    return enriched;
}

// Format duration in seconds to HH:MM:SS or MM:SS
function formatDuration(seconds) {
    if (!seconds || seconds <= 0) return '0:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
}

// ==================== ERROR HANDLING ====================

// 404 handler for API routes
router.use((req, res) => {
    res.status(404).json({
        error: true,
        code: 404,
        message: 'API endpoint not found',
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
    });
});

// Global error handler
router.use((err, req, res, next) => {
    console.error('API Error:', err);
    
    res.status(err.status || 500).json({
        error: true,
        code: err.status || 500,
        message: err.message || 'Internal server error',
        timestamp: new Date().toISOString(),
        path: req.path,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

module.exports = router;
