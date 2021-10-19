console.log("LOADED BBC2SPOTIFY ON " + window.location.hostname);

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main(){

    // List of buttons that bring up track popover
    var list = document.querySelectorAll('[id^="track-"]')
    var tracklist = {}
    var episodeDate = document.getElementsByClassName("sc-c-episode__metadata__data")[0].lastChild.data

    var t = 200

    for (var i=0; i < list.length; i++){
        list[i].scrollIntoView()
        list[i].click()
        await sleep(t)
        try{
            var track = document.querySelectorAll('[href^="https://open.spotify.com/track/"]')[0]
            var trackMetadata = JSON.parse(track.getAttribute("data-bbc-metadata"))
            var trackTitle = trackMetadata.TID
            tracklist[trackTitle] = track.getAttribute("href")
        } catch {
            // No links found
        }

    }

    chrome.runtime.sendMessage({type: "tracklist" , track_list: tracklist, name: document.title, date: episodeDate}, function (response) {
        console.log(response.farewell);
    })
}

main()

