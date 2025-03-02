let queue = JSON.parse(localStorage.getItem("queue")) || [];
let player;
let nowPlayingTitle = "";

function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '315',
        width: '100%',
        playerVars: { 
            'autoplay': 1,       
            'controls': 1,       
            'rel': 0,            
            'modestbranding': 1,  
            'fs': 0,             
            'iv_load_policy': 3  
        },
        events: { 'onStateChange': onPlayerStateChange }
    });

    updateQueue();
}

function addSong() {
    const url = document.getElementById("songUrl").value.trim();
    const videoId = extractYouTubeID(url);

    if (!videoId) {
        alert("Enter a valid YouTube link!");
        return;
    }

    if (queue.some(song => song.videoId === videoId)) {
        alert("This song is already in the queue.");
        return;
    }

    fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`)
        .then(response => response.json())
        .then(data => {
            queue.push({ videoId, title: data.title });
            saveQueue();
            updateQueue();
            
            if (!player.getVideoData().video_id) {
                playNextSong();
            }
        })
        .catch(() => {
            alert("Could not fetch video title. Please try again.");
        });
}

function extractYouTubeID(url) {
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/]+\/[^\/]+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
}

function updateQueue() {
    const queueList = document.getElementById("queue");
    queueList.innerHTML = "";

    queue.forEach((song, index) => {
        const li = document.createElement("li");
        li.textContent = `${index + 1}. ${song.title}`;
        queueList.appendChild(li);
    });
}

function saveQueue() {
    localStorage.setItem("queue", JSON.stringify(queue));
}

function playNextSong() {
    if (queue.length === 0) {
        nowPlayingTitle = "No song playing";
        updateNowPlaying();
        return;
    }

    const nextSong = queue.shift();
    nowPlayingTitle = nextSong.title;
    player.loadVideoById(nextSong.videoId);
    updateNowPlaying();
    updateQueue();
    saveQueue();
}

function updateNowPlaying() {
    document.getElementById("nowPlaying").textContent = `${nowPlayingTitle}`;
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.ENDED) {
        playNextSong();
    }
}

function playVideo() {
    if (player) player.playVideo();
}

function pauseVideo() {
    if (player) player.pauseVideo();
}

function seekForward() {
    if (player) player.seekTo(player.getCurrentTime() + 5, true);
}

function seekBackward() {
    if (player) player.seekTo(player.getCurrentTime() - 5, true);
}

function nextSong() {
    playNextSong();
}

function updateProgress() {
    if (!player || player.getPlayerState() !== YT.PlayerState.PLAYING) return;

    const currentTime = player.getCurrentTime();
    const duration = player.getDuration();

    document.getElementById("currentTime").textContent = formatTime(currentTime);
    document.getElementById("duration").textContent = formatTime(duration);
    
    document.getElementById("progressBar").value = (currentTime / duration) * 100;
}

function seekToPosition() {
    const progressBar = document.getElementById("progressBar");
    const seekTime = (progressBar.value / 100) * player.getDuration();
    player.seekTo(seekTime, true);
}

function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? "0" : ""}${sec}`;
}

// Update progress bar every second
setInterval(updateProgress, 1000);

function setVolume() {
    const volume = document.getElementById("volume").value;
    player.setVolume(volume);

    const muteButton = document.getElementById("muteButton");
    if (volume == 0) {
        muteButton.innerHTML = "🔇";
    } else if (volume < 30) {
        muteButton.innerHTML = "🔈";
    } else if (volume < 70) {
        muteButton.innerHTML = "🔉";
    } else {
        muteButton.innerHTML = "🔊";
    }
}

function toggleMute() {
    const volumeSlider = document.getElementById("volume");
    if (player.isMuted()) {
        player.unMute();
        volumeSlider.value = player.getVolume();
    } else {
        player.mute();
        volumeSlider.value = 0;
    }
    setVolume();
}

document.addEventListener("keydown", function(event) {
    if (event.code === "Space") {
        event.preventDefault();
        player.getPlayerState() === 1 ? pauseVideo() : playVideo();
    } else if (event.code === "ArrowLeft") {
        seekBackward();
    } else if (event.code === "ArrowRight") {
        seekForward();
    }
});

// Restore queue from localStorage on page load
window.onload = () => updateQueue();