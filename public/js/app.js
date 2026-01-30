// API URLs (add new stream endpoints)
const API_BASE = '/api';
const API_URL_STREAM = `${API_BASE}/stream`;
const API_URL_STREAM_QUALITY = `${API_BASE}/stream-quality`;
const API_URL_PLAYBACK = `${API_BASE}/playback`;
const API_URL_VALIDATE = `${API_BASE}/validate`;
const API_URL_SUBTITLES = `${API_BASE}/subtitles`;

// Global variables for video player
let videoPlayer = null;
let currentStreamData = null;
let currentVideoId = null;
let currentQuality = 'auto';
let playerInitialized = false;
let playbackHistory = [];

// Initialize video player
function initializeVideoPlayer() {
    if (playerInitialized) return;
    
    // Create video player modal if it doesn't exist
    if (!document.getElementById('videoPlayerModal')) {
        createVideoPlayerModal();
    }
    
    playerInitialized = true;
    console.log('Video player initialized');
}

// Create video player modal
function createVideoPlayerModal() {
    const modal = document.createElement('div');
    modal.id = 'videoPlayerModal';
    modal.className = 'drama-modal video-player-modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 1000px; background-color: #000;">
            <div class="modal-header" style="background: linear-gradient(135deg, #000, #333);">
                <h2 id="playerTitle" style="color: white;">Video Player</h2>
                <div class="player-controls-top">
                    <button class="player-btn" id="qualityBtn" title="Quality">
                        <i class="fas fa-cog"></i> Quality
                    </button>
                    <button class="player-btn" id="subtitleBtn" title="Subtitles">
                        <i class="fas fa-closed-captioning"></i> Subtitles
                    </button>
                    <button class="player-btn" id="fullscreenBtn" title="Fullscreen">
                        <i class="fas fa-expand"></i>
                    </button>
                    <button class="close-modal" id="closePlayer">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="modal-body" style="padding: 0; position: relative;">
                <!-- Video Container -->
                <div class="video-container" id="videoContainer">
                    <div class="video-loading" id="videoLoading">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>Loading video stream...</p>
                    </div>
                    
                    <!-- Video Element -->
                    <video id="mainVideoPlayer" class="video-js vjs-default-skin vjs-big-play-centered" 
                           controls preload="auto" playsinline>
                        <p class="vjs-no-js">
                            To view this video please enable JavaScript, and consider upgrading to a
                            web browser that <a href="https://videojs.com/html5-video-support/" target="_blank">
                            supports HTML5 video</a>
                        </p>
                    </video>
                    
                    <!-- Custom Controls -->
                    <div class="custom-controls" id="customControls">
                        <div class="progress-container">
                            <div class="progress-bar" id="progressBar">
                                <div class="progress-filled" id="progressFilled"></div>
                                <div class="progress-thumb" id="progressThumb"></div>
                            </div>
                            <div class="time-display">
                                <span id="currentTime">0:00</span> / <span id="durationTime">0:00</span>
                            </div>
                        </div>
                        
                        <div class="control-buttons">
                            <button class="control-btn" id="playPauseBtn">
                                <i class="fas fa-play"></i>
                            </button>
                            <button class="control-btn" id="rewindBtn">
                                <i class="fas fa-backward"></i> 10s
                            </button>
                            <button class="control-btn" id="forwardBtn">
                                <i class="fas fa-forward"></i> 10s
                            </button>
                            <button class="control-btn" id="volumeBtn">
                                <i class="fas fa-volume-up"></i>
                            </button>
                            <div class="volume-slider" id="volumeSlider">
                                <input type="range" min="0" max="100" value="100" id="volumeControl">
                            </div>
                            <button class="control-btn" id="pipBtn" title="Picture-in-Picture">
                                <i class="fas fa-picture-in-picture"></i>
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Video Info Panel -->
                <div class="video-info-panel" id="videoInfoPanel">
                    <div class="video-info-header">
                        <h3 id="videoEpisodeTitle">Episode 1</h3>
                        <div class="video-stats">
                            <span><i class="fas fa-eye"></i> <span id="viewCount">0</span> views</span>
                            <span><i class="fas fa-heart"></i> <span id="likeCount">0</span> likes</span>
                            <span><i class="fas fa-clock"></i> <span id="durationDisplay">0:00</span></span>
                        </div>
                    </div>
                    
                    <div class="video-description" id="videoDescription">
                        Loading video description...
                    </div>
                    
                    <div class="video-quality-info">
                        <div class="quality-badge" id="currentQualityBadge">
                            <i class="fas fa-hd"></i> <span id="currentQualityText">Auto</span>
                        </div>
                        <div class="resolution-info">
                            <i class="fas fa-expand-arrows-alt"></i> 
                            <span id="resolutionInfo">Loading...</span>
                        </div>
                    </div>
                </div>
                
                <!-- Quality Selection Modal -->
                <div class="quality-modal" id="qualityModal">
                    <div class="quality-modal-content">
                        <h3><i class="fas fa-cog"></i> Select Quality</h3>
                        <div class="quality-options" id="qualityOptions">
                            <div class="quality-option active" data-quality="auto">
                                <i class="fas fa-magic"></i>
                                <span>Auto (Recommended)</span>
                                <span class="quality-desc">Best for your connection</span>
                            </div>
                        </div>
                        <div class="quality-actions">
                            <button class="quality-btn" id="applyQuality">Apply</button>
                            <button class="quality-btn cancel" id="cancelQuality">Cancel</button>
                        </div>
                    </div>
                </div>
                
                <!-- Subtitle Selection Modal -->
                <div class="subtitle-modal" id="subtitleModal">
                    <div class="subtitle-modal-content">
                        <h3><i class="fas fa-closed-captioning"></i> Subtitles</h3>
                        <div class="subtitle-options" id="subtitleOptions">
                            <div class="subtitle-option active" data-subtitle="none">
                                <i class="fas fa-ban"></i>
                                <span>None</span>
                            </div>
                            <div class="subtitle-option" data-subtitle="id">
                                <i class="fas fa-flag"></i>
                                <span>Bahasa Indonesia</span>
                            </div>
                            <div class="subtitle-option" data-subtitle="en">
                                <i class="fas fa-flag-usa"></i>
                                <span>English</span>
                            </div>
                        </div>
                        <div class="subtitle-actions">
                            <button class="subtitle-btn" id="applySubtitle">Apply</button>
                            <button class="subtitle-btn cancel" id="cancelSubtitle">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Episode Navigation -->
            <div class="episode-navigation" id="episodeNavigation">
                <button class="episode-nav-btn prev" id="prevEpisode">
                    <i class="fas fa-chevron-left"></i> Previous Episode
                </button>
                <div class="episode-list-toggle" id="episodeListToggle">
                    <i class="fas fa-list"></i> Episode List
                </div>
                <button class="episode-nav-btn next" id="nextEpisode">
                    Next Episode <i class="fas fa-chevron-right"></i>
                </button>
            </div>
            
            <!-- Episode List Sidebar -->
            <div class="episode-sidebar" id="episodeSidebar">
                <div class="episode-sidebar-header">
                    <h3><i class="fas fa-film"></i> Episodes</h3>
                    <button class="close-sidebar" id="closeSidebar">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="episode-list" id="episodeList">
                    <!-- Episode list will be populated here -->
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    setupVideoPlayerEvents();
}

// Setup video player events
function setupVideoPlayerEvents() {
    // Player controls
    const videoElement = document.getElementById('mainVideoPlayer');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const rewindBtn = document.getElementById('rewindBtn');
    const forwardBtn = document.getElementById('forwardBtn');
    const volumeBtn = document.getElementById('volumeBtn');
    const volumeControl = document.getElementById('volumeControl');
    const pipBtn = document.getElementById('pipBtn');
    const progressBar = document.getElementById('progressBar');
    const progressFilled = document.getElementById('progressFilled');
    const progressThumb = document.getElementById('progressThumb');
    const currentTimeEl = document.getElementById('currentTime');
    const durationTimeEl = document.getElementById('durationTime');
    const closePlayer = document.getElementById('closePlayer');
    
    // Quality controls
    const qualityBtn = document.getElementById('qualityBtn');
    const qualityModal = document.getElementById('qualityModal');
    const applyQuality = document.getElementById('applyQuality');
    const cancelQuality = document.getElementById('cancelQuality');
    
    // Subtitle controls
    const subtitleBtn = document.getElementById('subtitleBtn');
    const subtitleModal = document.getElementById('subtitleModal');
    const applySubtitle = document.getElementById('applySubtitle');
    const cancelSubtitle = document.getElementById('cancelSubtitle');
    
    // Fullscreen
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    
    // Episode navigation
    const prevEpisode = document.getElementById('prevEpisode');
    const nextEpisode = document.getElementById('nextEpisode');
    const episodeListToggle = document.getElementById('episodeListToggle');
    const episodeSidebar = document.getElementById('episodeSidebar');
    const closeSidebar = document.getElementById('closeSidebar');
    
    // Initialize video.js if available
    if (typeof videojs !== 'undefined') {
        videoPlayer = videojs('mainVideoPlayer', {
            controls: false, // We use custom controls
            autoplay: false,
            preload: 'auto',
            responsive: true,
            fluid: true,
            playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
            controlBar: false
        });
        
        // Video.js events
        videoPlayer.on('play', () => {
            playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        });
        
        videoPlayer.on('pause', () => {
            playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        });
        
        videoPlayer.on('timeupdate', () => {
            updateProgress();
        });
        
        videoPlayer.on('loadedmetadata', () => {
            updateDuration();
        });
        
        videoPlayer.on('volumechange', () => {
            updateVolumeUI();
        });
    } else {
        // Fallback to native video element
        videoElement.addEventListener('play', () => {
            playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        });
        
        videoElement.addEventListener('pause', () => {
            playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        });
        
        videoElement.addEventListener('timeupdate', () => {
            updateProgress();
        });
        
        videoElement.addEventListener('loadedmetadata', () => {
            updateDuration();
        });
        
        videoElement.addEventListener('volumechange', () => {
            updateVolumeUI();
        });
    }
    
    // Play/Pause
    playPauseBtn.addEventListener('click', () => {
        if (videoPlayer) {
            if (videoPlayer.paused()) {
                videoPlayer.play();
            } else {
                videoPlayer.pause();
            }
        } else {
            if (videoElement.paused) {
                videoElement.play();
            } else {
                videoElement.pause();
            }
        }
    });
    
    // Rewind 10 seconds
    rewindBtn.addEventListener('click', () => {
        if (videoPlayer) {
            videoPlayer.currentTime(Math.max(0, videoPlayer.currentTime() - 10));
        } else {
            videoElement.currentTime = Math.max(0, videoElement.currentTime - 10);
        }
    });
    
    // Forward 10 seconds
    forwardBtn.addEventListener('click', () => {
        if (videoPlayer) {
            videoPlayer.currentTime(Math.min(videoPlayer.duration(), videoPlayer.currentTime() + 10));
        } else {
            videoElement.currentTime = Math.min(videoElement.duration, videoElement.currentTime + 10);
        }
    });
    
    // Volume control
    volumeControl.addEventListener('input', (e) => {
        const volume = e.target.value / 100;
        if (videoPlayer) {
            videoPlayer.volume(volume);
        } else {
            videoElement.volume = volume;
        }
    });
    
    // Picture-in-Picture
    pipBtn.addEventListener('click', async () => {
        if (document.pictureInPictureElement) {
            await document.exitPictureInPicture();
        } else if (document.pictureInPictureEnabled) {
            if (videoPlayer) {
                await videoPlayer.el().requestPictureInPicture();
            } else {
                await videoElement.requestPictureInPicture();
            }
        }
    });
    
    // Progress bar
    let isDragging = false;
    
    progressBar.addEventListener('click', (e) => {
        if (!isDragging) {
            const rect = progressBar.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            seekTo(percent);
        }
    });
    
    progressThumb.addEventListener('mousedown', () => {
        isDragging = true;
        document.addEventListener('mousemove', handleDrag);
        document.addEventListener('mouseup', () => {
            isDragging = false;
            document.removeEventListener('mousemove', handleDrag);
        });
    });
    
    progressThumb.addEventListener('touchstart', () => {
        isDragging = true;
        document.addEventListener('touchmove', handleDragTouch);
        document.addEventListener('touchend', () => {
            isDragging = false;
            document.removeEventListener('touchmove', handleDragTouch);
        });
    });
    
    function handleDrag(e) {
        if (isDragging) {
            const rect = progressBar.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            updateProgressUI(percent);
        }
    }
    
    function handleDragTouch(e) {
        if (isDragging && e.touches.length > 0) {
            const rect = progressBar.getBoundingClientRect();
            const percent = (e.touches[0].clientX - rect.left) / rect.width;
            updateProgressUI(percent);
        }
    }
    
    // Quality modal
    qualityBtn.addEventListener('click', () => {
        showQualityModal();
    });
    
    applyQuality.addEventListener('click', () => {
        const selected = document.querySelector('.quality-option.active');
        if (selected) {
            const quality = selected.getAttribute('data-quality');
            changeVideoQuality(quality);
        }
        hideQualityModal();
    });
    
    cancelQuality.addEventListener('click', hideQualityModal);
    
    // Subtitle modal
    subtitleBtn.addEventListener('click', () => {
        showSubtitleModal();
    });
    
    applySubtitle.addEventListener('click', () => {
        const selected = document.querySelector('.subtitle-option.active');
        if (selected) {
            const subtitle = selected.getAttribute('data-subtitle');
            changeSubtitle(subtitle);
        }
        hideSubtitleModal();
    });
    
    cancelSubtitle.addEventListener('click', hideSubtitleModal);
    
    // Fullscreen
    fullscreenBtn.addEventListener('click', () => {
        const modal = document.querySelector('.video-player-modal .modal-content');
        if (!document.fullscreenElement) {
            if (modal.requestFullscreen) {
                modal.requestFullscreen();
            } else if (modal.webkitRequestFullscreen) {
                modal.webkitRequestFullscreen();
            } else if (modal.msRequestFullscreen) {
                modal.msRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    });
    
    // Close player
    closePlayer.addEventListener('click', closeVideoPlayer);
    
    // Episode navigation
    prevEpisode.addEventListener('click', playPreviousEpisode);
    nextEpisode.addEventListener('click', playNextEpisode);
    episodeListToggle.addEventListener('click', () => {
        episodeSidebar.classList.toggle('active');
    });
    closeSidebar.addEventListener('click', () => {
        episodeSidebar.classList.remove('active');
    });
    
    // Close modal when clicking outside
    document.getElementById('videoPlayerModal').addEventListener('click', (e) => {
        if (e.target.id === 'videoPlayerModal') {
            closeVideoPlayer();
        }
    });
}

// Update progress bar
function updateProgress() {
    const video = videoPlayer || document.getElementById('mainVideoPlayer');
    const currentTime = video.currentTime || video.currentTime;
    const duration = video.duration || video.duration;
    
    if (duration) {
        const percent = (currentTime / duration) * 100;
        updateProgressUI(percent);
        
        // Update time display
        document.getElementById('currentTime').textContent = formatTime(currentTime);
        document.getElementById('durationTime').textContent = formatTime(duration);
    }
}

function updateProgressUI(percent) {
    const progress = Math.min(100, Math.max(0, percent));
    document.getElementById('progressFilled').style.width = `${progress}%`;
    document.getElementById('progressThumb').style.left = `${progress}%`;
}

function seekTo(percent) {
    const video = videoPlayer || document.getElementById('mainVideoPlayer');
    const duration = video.duration || video.duration;
    
    if (duration) {
        const time = duration * percent;
        if (videoPlayer) {
            videoPlayer.currentTime(time);
        } else {
            video.currentTime = time;
        }
    }
}

function updateDuration() {
    const video = videoPlayer || document.getElementById('mainVideoPlayer');
    const duration = video.duration || video.duration;
    
    if (duration) {
        document.getElementById('durationTime').textContent = formatTime(duration);
        document.getElementById('durationDisplay').textContent = formatTime(duration);
    }
}

function updateVolumeUI() {
    const video = videoPlayer || document.getElementById('mainVideoPlayer');
    const volume = video.volume !== undefined ? video.volume : video.volume;
    const volumeBtn = document.getElementById('volumeBtn');
    
    document.getElementById('volumeControl').value = volume * 100;
    
    if (volume === 0) {
        volumeBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
    } else if (volume < 0.5) {
        volumeBtn.innerHTML = '<i class="fas fa-volume-down"></i>';
    } else {
        volumeBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
    }
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Show quality modal
function showQualityModal() {
    document.getElementById('qualityModal').style.display = 'block';
}

function hideQualityModal() {
    document.getElementById('qualityModal').style.display = 'none';
}

// Show subtitle modal
function showSubtitleModal() {
    document.getElementById('subtitleModal').style.display = 'block';
}

function hideSubtitleModal() {
    document.getElementById('subtitleModal').style.display = 'none';
}

// Change video quality
async function changeVideoQuality(quality) {
    if (!currentVideoId) return;
    
    try {
        showPlayerLoading('Changing quality...');
        
        const response = await fetch(`${API_URL_STREAM_QUALITY}/${currentVideoId}?quality=${quality}`);
        const data = await response.json();
        
        if (data.code === 0 && data.data) {
            currentQuality = quality;
            currentStreamData = data.data;
            
            // Update UI
            document.getElementById('currentQualityText').textContent = 
                quality === 'auto' ? 'Auto' : quality.toUpperCase();
            document.getElementById('currentQualityBadge').className = 
                `quality-badge ${quality === 'auto' ? 'auto' : quality}`;
            
            // Update resolution info
            if (data.data.video_width && data.data.video_height) {
                document.getElementById('resolutionInfo').textContent = 
                    `${data.data.video_width}x${data.data.video_height}`;
            }
            
            // Reload video with new quality
            await loadVideoStream(currentVideoId, quality);
            
            hidePlayerLoading();
        } else {
            throw new Error(data.message || 'Failed to change quality');
        }
    } catch (error) {
        console.error('Error changing quality:', error);
        hidePlayerLoading();
        showPlayerError('Failed to change video quality');
    }
}

// Change subtitle
function changeSubtitle(subtitle) {
    // Update active subtitle option
    document.querySelectorAll('.subtitle-option').forEach(option => {
        option.classList.remove('active');
    });
    document.querySelector(`.subtitle-option[data-subtitle="${subtitle}"]`).classList.add('active');
    
    // In a real implementation, you would load the subtitle track here
    console.log('Subtitle changed to:', subtitle);
}

// Play video stream
async function playVideoStream(videoId, episodeInfo = {}) {
    try {
        initializeVideoPlayer();
        currentVideoId = videoId;
        
        // Show player
        const playerModal = document.getElementById('videoPlayerModal');
        playerModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Update episode info
        if (episodeInfo.title) {
            document.getElementById('playerTitle').textContent = episodeInfo.title;
            document.getElementById('videoEpisodeTitle').textContent = episodeInfo.title;
        }
        
        if (episodeInfo.description) {
            document.getElementById('videoDescription').textContent = episodeInfo.description;
        }
        
        if (episodeInfo.episodeNumber) {
            document.getElementById('playerTitle').textContent = `Episode ${episodeInfo.episodeNumber}`;
        }
        
        // Load video stream
        showPlayerLoading('Loading video stream...');
        await loadVideoStream(videoId, currentQuality);
        
        // Load available qualities
        await loadQualityOptions(videoId);
        
        // Load subtitles
        await loadSubtitles(videoId);
        
        // Load episode list if available
        if (episodeInfo.seriesId) {
            await loadEpisodeList(episodeInfo.seriesId, episodeInfo.episodeNumber);
        }
        
        // Record playback start
        recordPlaybackStart(videoId, episodeInfo);
        
    } catch (error) {
        console.error('Error playing video:', error);
        showPlayerError('Failed to load video stream');
    }
}

// Load video stream
async function loadVideoStream(videoId, quality = 'auto') {
    try {
        const response = await fetch(`${API_URL_STREAM_QUALITY}/${videoId}?quality=${quality}`);
        const data = await response.json();
        
        if (data.code === 0 && data.data) {
            currentStreamData = data.data;
            
            // Get video URL
            let videoUrl;
            if (quality === 'auto' || !data.data.selected_url) {
                videoUrl = data.data.main_url;
            } else {
                videoUrl = data.data.selected_url;
            }
            
            // Validate URL
            if (!videoUrl || !videoUrl.startsWith('http')) {
                throw new Error('Invalid video URL');
            }
            
            // Load video into player
            const videoElement = videoPlayer || document.getElementById('mainVideoPlayer');
            
            if (videoPlayer) {
                videoPlayer.src({
                    src: videoUrl,
                    type: 'video/mp4'
                });
                
                // Add backup source if available
                if (data.data.backup_url || data.data.selected_backup) {
                    videoPlayer.ready(() => {
                        const backupUrl = data.data.selected_backup || data.data.backup_url;
                        // In a real implementation, you would handle backup sources
                        console.log('Backup URL available:', backupUrl);
                    });
                }
                
                videoPlayer.load();
                videoPlayer.play().catch(e => {
                    console.log('Autoplay prevented:', e);
                    // Show play button
                });
            } else {
                videoElement.src = videoUrl;
                videoElement.load();
                videoElement.play().catch(e => {
                    console.log('Autoplay prevented:', e);
                    // Show play button
                });
            }
            
            // Update UI with stream info
            updateStreamInfoUI(data.data);
            hidePlayerLoading();
            
            return true;
        } else {
            throw new Error(data.message || 'Failed to load stream');
        }
    } catch (error) {
        console.error('Error loading video stream:', error);
        
        // Try fallback to basic stream endpoint
        try {
            const fallbackResponse = await fetch(`${API_URL_STREAM}/${videoId}`);
            const fallbackData = await fallbackResponse.json();
            
            if (fallbackData.code === 0 && fallbackData.data && fallbackData.data.main_url) {
                // Use basic stream URL
                const videoElement = videoPlayer || document.getElementById('mainVideoPlayer');
                
                if (videoPlayer) {
                    videoPlayer.src({
                        src: fallbackData.data.main_url,
                        type: 'video/mp4'
                    });
                    videoPlayer.load();
                } else {
                    videoElement.src = fallbackData.data.main_url;
                    videoElement.load();
                }
                
                updateStreamInfoUI(fallbackData.data);
                hidePlayerLoading();
                return true;
            }
        } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
        }
        
        throw error;
    }
}

// Load quality options
async function loadQualityOptions(videoId) {
    try {
        const response = await fetch(`${API_URL_STREAM_QUALITY}/${videoId}?quality=auto`);
        const data = await response.json();
        
        if (data.code === 0 && data.data && data.data.quality_options) {
            const qualityOptions = document.getElementById('qualityOptions');
            qualityOptions.innerHTML = '';
            
            // Add auto option
            const autoOption = document.createElement('div');
            autoOption.className = `quality-option ${currentQuality === 'auto' ? 'active' : ''}`;
            autoOption.setAttribute('data-quality', 'auto');
            autoOption.innerHTML = `
                <i class="fas fa-magic"></i>
                <span>Auto (Recommended)</span>
                <span class="quality-desc">Best for your connection</span>
            `;
            autoOption.addEventListener('click', () => {
                document.querySelectorAll('.quality-option').forEach(opt => opt.classList.remove('active'));
                autoOption.classList.add('active');
            });
            qualityOptions.appendChild(autoOption);
            
            // Add other quality options
            Object.keys(data.data.quality_options).forEach(qualityKey => {
                const quality = data.data.quality_options[qualityKey];
                
                const option = document.createElement('div');
                option.className = `quality-option ${currentQuality === quality.definition ? 'active' : ''}`;
                option.setAttribute('data-quality', quality.definition);
                option.innerHTML = `
                    <i class="fas fa-hd"></i>
                    <span>${quality.definition.toUpperCase()}</span>
                    <span class="quality-desc">${quality.vwidth}x${quality.vheight} • ${Math.round(quality.size / (1024 * 1024))}MB</span>
                `;
                option.addEventListener('click', () => {
                    document.querySelectorAll('.quality-option').forEach(opt => opt.classList.remove('active'));
                    option.classList.add('active');
                });
                qualityOptions.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading quality options:', error);
    }
}

// Load subtitles
async function loadSubtitles(videoId) {
    try {
        const response = await fetch(`${API_URL_SUBTITLES}/${videoId}`);
        const data = await response.json();
        
        if (data.code === 0 && data.data) {
            const subtitleOptions = document.getElementById('subtitleOptions');
            
            if (data.data.available && data.data.subtitles && data.data.subtitles.length > 0) {
                subtitleOptions.innerHTML = '';
                
                // Add "None" option
                const noneOption = document.createElement('div');
                noneOption.className = 'subtitle-option active';
                noneOption.setAttribute('data-subtitle', 'none');
                noneOption.innerHTML = `
                    <i class="fas fa-ban"></i>
                    <span>None</span>
                `;
                noneOption.addEventListener('click', () => {
                    document.querySelectorAll('.subtitle-option').forEach(opt => opt.classList.remove('active'));
                    noneOption.classList.add('active');
                });
                subtitleOptions.appendChild(noneOption);
                
                // Add subtitle options
                data.data.subtitles.forEach(subtitle => {
                    const option = document.createElement('div');
                    option.className = 'subtitle-option';
                    option.setAttribute('data-subtitle', subtitle.language_code);
                    option.innerHTML = `
                        <i class="fas fa-flag"></i>
                        <span>${subtitle.language}</span>
                    `;
                    option.addEventListener('click', () => {
                        document.querySelectorAll('.subtitle-option').forEach(opt => opt.classList.remove('active'));
                        option.classList.add('active');
                    });
                    subtitleOptions.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Error loading subtitles:', error);
    }
}

// Load episode list
async function loadEpisodeList(seriesId, currentEpisodeNumber) {
    try {
        // Fetch episodes from the detail endpoint
        const response = await fetch(`${API_BASE}/detail/${seriesId}`);
        const data = await response.json();
        
        if (data.code === 0 && data.data && data.data.video_data && data.data.video_data.video_list) {
            const episodes = data.data.video_data.video_list;
            const episodeList = document.getElementById('episodeList');
            episodeList.innerHTML = '';
            
            episodes.forEach(episode => {
                const episodeItem = document.createElement('div');
                episodeItem.className = `episode-item ${episode.vid_index == currentEpisodeNumber ? 'active' : ''}`;
                episodeItem.setAttribute('data-vid', episode.vid);
                episodeItem.setAttribute('data-episode', episode.vid_index);
                episodeItem.innerHTML = `
                    <div class="episode-thumb">
                        <img src="${episode.cover || episode.episode_cover}" 
                             alt="Episode ${episode.vid_index}"
                             onerror="this.onerror=null;this.src='/images/placeholder.jpg';">
                        <div class="episode-number">${episode.vid_index}</div>
                    </div>
                    <div class="episode-info">
                        <div class="episode-title">Episode ${episode.vid_index}</div>
                        <div class="episode-meta">
                            <span>${formatDuration(episode.duration || 0)}</span>
                            <span>${episode.digged_count ? episode.digged_count.toLocaleString() : '0'} ❤️</span>
                        </div>
                    </div>
                `;
                
                episodeItem.addEventListener('click', () => {
                    playEpisodeFromList(episode.vid, episode.vid_index, episode);
                });
                
                episodeList.appendChild(episodeItem);
            });
        }
    } catch (error) {
        console.error('Error loading episode list:', error);
    }
}

// Play episode from list
function playEpisodeFromList(videoId, episodeNumber, episodeInfo) {
    playVideoStream(videoId, {
        title: `Episode ${episodeNumber}`,
        description: episodeInfo.title || 'No description available',
        episodeNumber: episodeNumber,
        seriesId: episodeInfo.series_id
    });
}

// Play previous episode
function playPreviousEpisode() {
    const currentEpisode = document.querySelector('.episode-item.active');
    if (currentEpisode) {
        const prevEpisode = currentEpisode.previousElementSibling;
        if (prevEpisode && prevEpisode.classList.contains('episode-item')) {
            const videoId = prevEpisode.getAttribute('data-vid');
            const episodeNumber = prevEpisode.getAttribute('data-episode');
            playEpisodeFromList(videoId, episodeNumber, {});
        }
    }
}

// Play next episode
function playNextEpisode() {
    const currentEpisode = document.querySelector('.episode-item.active');
    if (currentEpisode) {
        const nextEpisode = currentEpisode.nextElementSibling;
        if (nextEpisode && nextEpisode.classList.contains('episode-item')) {
            const videoId = nextEpisode.getAttribute('data-vid');
            const episodeNumber = nextEpisode.getAttribute('data-episode');
            playEpisodeFromList(videoId, episodeNumber, {});
        }
    }
}

// Update stream info UI
function updateStreamInfoUI(streamData) {
    // Update resolution
    if (streamData.video_width && streamData.video_height) {
        document.getElementById('resolutionInfo').textContent = 
            `${streamData.video_width}x${streamData.video_height}`;
    }
    
    // Update quality badge
    const qualityText = document.getElementById('currentQualityText');
    if (currentQuality === 'auto' && streamData.auto_definition) {
        qualityText.textContent = `Auto (${streamData.auto_definition})`;
    } else {
        qualityText.textContent = currentQuality === 'auto' ? 'Auto' : currentQuality.toUpperCase();
    }
    
    // Update quality badge class
    const qualityBadge = document.getElementById('currentQualityBadge');
    qualityBadge.className = `quality-badge ${currentQuality === 'auto' ? 'auto' : currentQuality}`;
    
    // Update expiry info (if available)
    if (streamData.expire_time) {
        const expiryDate = new Date(streamData.expire_time * 1000);
        const now = new Date();
        const hoursRemaining = Math.floor((expiryDate - now) / (1000 * 60 * 60));
        
        if (hoursRemaining < 24) {
            console.log(`Stream URL expires in ${hoursRemaining} hours`);
        }
    }
}

// Show player loading
function showPlayerLoading(message = 'Loading...') {
    const loadingEl = document.getElementById('videoLoading');
    if (loadingEl) {
        loadingEl.style.display = 'flex';
        loadingEl.querySelector('p').textContent = message;
    }
}

function hidePlayerLoading() {
    const loadingEl = document.getElementById('videoLoading');
    if (loadingEl) {
        loadingEl.style.display = 'none';
    }
}

// Show player error
function showPlayerError(message) {
    const videoContainer = document.getElementById('videoContainer');
    const errorEl = document.createElement('div');
    errorEl.className = 'video-error';
    errorEl.innerHTML = `
        <div style="text-align: center; padding: 40px; color: white;">
            <i class="fas fa-exclamation-triangle" style="font-size: 50px; color: var(--primary-color); margin-bottom: 20px;"></i>
            <h3 style="margin-bottom: 15px;">Stream Error</h3>
            <p style="margin-bottom: 20px; color: var(--text-secondary);">${message}</p>
            <button onclick="retryVideoStream()" class="watch-btn" style="padding: 12px 30px;">
                <i class="fas fa-redo"></i> Try Again
            </button>
        </div>
    `;
    
    // Remove existing error
    const existingError = videoContainer.querySelector('.video-error');
    if (existingError) {
        existingError.remove();
    }
    
    videoContainer.appendChild(errorEl);
    hidePlayerLoading();
}

// Retry video stream
async function retryVideoStream() {
    if (currentVideoId) {
        const errorEl = document.querySelector('.video-error');
        if (errorEl) errorEl.remove();
        
        showPlayerLoading('Retrying...');
        await loadVideoStream(currentVideoId, currentQuality);
    }
}

// Record playback start
function recordPlaybackStart(videoId, episodeInfo) {
    const playbackRecord = {
        videoId: videoId,
        episodeNumber: episodeInfo.episodeNumber || 1,
        seriesId: episodeInfo.seriesId || null,
        timestamp: new Date().toISOString(),
        quality: currentQuality,
        duration: 0 // Will update when playback ends
    };
    
    playbackHistory.push(playbackRecord);
    
    // Save to localStorage
    try {
        const history = JSON.parse(localStorage.getItem('playbackHistory') || '[]');
        history.unshift(playbackRecord);
        localStorage.setItem('playbackHistory', JSON.stringify(history.slice(0, 50))); // Keep last 50
    } catch (e) {
        console.error('Error saving playback history:', e);
    }
}

// Close video player
function closeVideoPlayer() {
    const playerModal = document.getElementById('videoPlayerModal');
    if (playerModal) {
        playerModal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Pause video
        if (videoPlayer) {
            videoPlayer.pause();
        } else {
            const videoElement = document.getElementById('mainVideoPlayer');
            if (videoElement) videoElement.pause();
        }
        
        // Record playback end
        if (currentVideoId && playbackHistory.length > 0) {
            const lastRecord = playbackHistory[playbackHistory.length - 1];
            lastRecord.endedAt = new Date().toISOString();
            
            if (videoPlayer) {
                lastRecord.duration = videoPlayer.currentTime();
            }
        }
    }
}

// Update existing playEpisode function to use new player
window.playEpisode = async function(episodeNumber, vid = null, episodeInfo = {}) {
    try {
        // If we have episode info with video ID, use it directly
        if (vid) {
            await playVideoStream(vid, {
                title: `Episode ${episodeNumber}`,
                description: episodeInfo.title || 'No description available',
                episodeNumber: episodeNumber,
                seriesId: episodeInfo.series_id || currentDramaDetail?.video_data?.series_id_str
            });
            return;
        }
        
        // Otherwise, try to find the video ID from current episodes
        if (currentEpisodes && currentEpisodes.length > 0) {
            const episode = currentEpisodes.find(ep => 
                ep.vid_index == episodeNumber || ep.vid === vid
            );
            
            if (episode && episode.vid) {
                await playVideoStream(episode.vid, {
                    title: `Episode ${episodeNumber}`,
                    description: episode.title || 'No description available',
                    episodeNumber: episodeNumber,
                    seriesId: episode.series_id
                });
            } else {
                showCustomModal('Episode Tidak Ditemukan', `
                    <div style="text-align: center;">
                        <p>Episode ${episodeNumber} tidak ditemukan.</p>
                        <button onclick="closeCustomModal()" class="watch-btn">
                            Tutup
                        </button>
                    </div>
                `, true);
            }
        } else {
            // Fallback to simulation mode
            showCustomModal('Streaming Dimulai', `
                <div style="text-align: center;">
                    <h3 style="margin-bottom: 20px; color: var(--primary-color);">
                        <i class="fas fa-play-circle"></i> Memulai Streaming
                    </h3>
                    <p style="margin-bottom: 20px;">
                        Episode <strong>${episodeNumber}</strong> akan segera dimulai...
                    </p>
                    <div style="background-color: var(--light-bg); padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                        <p style="color: var(--text-secondary); font-style: italic;">
                            "Player video akan muncul di sini"
                        </p>
                    </div>
                    <p style="font-size: 14px; color: var(--text-secondary);">
                        <i class="fas fa-info-circle"></i> Untuk streaming langsung, pastikan API stream tersedia.
                    </p>
                    <div style="margin-top: 30px;">
                        <button onclick="testStreamAPI()" class="trailer-btn" style="margin-right: 10px;">
                            <i class="fas fa-video"></i> Test Stream API
                        </button>
                        <button onclick="closeCustomModal()" class="watch-btn">
                            <i class="fas fa-times"></i> Tutup
                        </button>
                    </div>
                </div>
            `, false);
        }
    } catch (error) {
        console.error('Error playing episode:', error);
        showModalError('Gagal memulai streaming: ' + error.message);
    }
};

// Test stream API
async function testStreamAPI() {
    try {
        showCustomModal('Testing Stream API', `
            <div style="text-align: center;">
                <div class="loading" style="margin: 20px 0;">
                    <i class="fas fa-spinner fa-spin" style="color: var(--primary-color); font-size: 30px;"></i>
                </div>
                <p>Menguji koneksi ke API stream...</p>
            </div>
        `, false);
        
        // Test with a known video ID (from the example)
        const testVideoId = '7583564321033030661';
        const response = await fetch(`${API_URL_VALIDATE}/${testVideoId}`);
        const data = await response.json();
        
        if (data.code === 0 && data.data.valid) {
            showCustomModal('API Stream Berfungsi', `
                <div style="text-align: center;">
                    <div style="margin-bottom: 20px;">
                        <i class="fas fa-check-circle" style="color: #4CAF50; font-size: 50px;"></i>
                    </div>
                    <p style="margin-bottom: 10px; font-size: 18px;">
                        API Stream berfungsi dengan baik!
                    </p>
                    <p style="color: var(--text-secondary); margin-bottom: 20px;">
                        Video ID: ${testVideoId}<br>
                        Status: Valid
                    </p>
                    <div style="background-color: var(--light-bg); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <p style="font-size: 14px; color: var(--text-secondary);">
                            <i class="fas fa-lightbulb"></i> Coba gunakan video ID dari daftar episode untuk streaming langsung.
                        </p>
                    </div>
                    <button onclick="closeCustomModal()" class="watch-btn">
                        <i class="fas fa-times"></i> Tutup
                    </button>
                </div>
            `, true);
        } else {
            throw new Error(data.message || 'API validation failed');
        }
    } catch (error) {
        showCustomModal('API Stream Error', `
            <div style="text-align: center;">
                <div style="margin-bottom: 20px;">
                    <i class="fas fa-exclamation-triangle" style="color: #ff6b00; font-size: 50px;"></i>
                </div>
                <p style="margin-bottom: 10px; font-size: 18px;">
                    Gagal mengakses API Stream
                </p>
                <p style="color: var(--text-secondary); margin-bottom: 20px;">
                    Error: ${error.message}
                </p>
                <div style="background-color: var(--light-bg); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <p style="font-size: 14px; color: var(--text-secondary;">
                        <i class="fas fa-lightbulb"></i> Pastikan endpoint API stream tersedia dan video ID valid.
                    </p>
                </div>
                <button onclick="closeCustomModal()" class="watch-btn">
                    <i class="fas fa-times"></i> Tutup
                </button>
            </div>
        `, true);
    }
}

// Initialize video player on page load
document.addEventListener('DOMContentLoaded', () => {
    // Check if video.js is available
    const videojsScript = document.createElement('script');
    videojsScript.src = 'https://vjs.zencdn.net/7.20.3/video.min.js';
    videojsScript.onload = initializeVideoPlayer;
    document.head.appendChild(videojsScript);
    
    // Load video.js CSS
    const videojsCSS = document.createElement('link');
    videojsCSS.rel = 'stylesheet';
    videojsCSS.href = 'https://vjs.zencdn.net/7.20.3/video-js.css';
    document.head.appendChild(videojsCSS);
});
