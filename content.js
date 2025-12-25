// Basic intersection observer configuration
const observerOptions = {
    root: null, // viewport
    rootMargin: '0px',
    threshold: 0.7 // Video must be 75% visible to play/unmute
};

// Map to keep track of videos we've already attached logic to, if needed, 
// though the IntersectionObserver handles duplicates well if we observe the same element.
const observedVideos = new WeakSet();

/**
 * Helper to safely interact with Reddit's video elements.
 * Reddit uses custom players, but often wraps standard <video> tags or uses shaka player info.
 * We'll try to target the <video> element directly.
 */
function handleVideoIntersection(entries, observer) {
    entries.forEach(entry => {
        const video = entry.target;

        if (entry.isIntersecting) {
            // Video is in view
            console.log('Video in view:', video);

            // Unmute
            video.muted = false;

            // Ensure playing
            if (video.paused) {
                const playPromise = video.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.log('Auto-play was prevented:', error);
                        // Often requires user interaction first on the page
                    });
                }
            }
        } else {
            // Video is out of view
            // Mute it (optional, but good for skipping noise) or Pause it
            console.log('Video out of view:', video);

            video.pause();
            video.muted = true; // Reset to muted so if it scrolls back it doesn't blast audio immediately if logic fails? 
            // Actually user wants "stops", so pause is correct. 
            // Muting on exit helps prevent blips.
        }
    });
}

const observer = new IntersectionObserver(handleVideoIntersection, observerOptions);

function scanForVideos() {
    // Reddit often uses shadow DOM or lazy loading. 
    // We look for all video elements.
    const videos = document.querySelectorAll('video');

    videos.forEach(video => {
        if (!observedVideos.has(video)) {
            observer.observe(video);
            observedVideos.add(video);

            // Set initial state if needed, but intersection observer will trigger initial check
        }
    });
}

// Watch for DOM changes to find new videos as user scrolls (infinite scroll)
const mutationObserver = new MutationObserver((mutations) => {
    // Debounce or just scan? Scan is relatively cheap for selector
    scanForVideos();
});

mutationObserver.observe(document.body, {
    childList: true,
    subtree: true
});

// Initial scan
scanForVideos();

console.log('Reddit Video Auto-Unmute Extension Loaded');
