var tracklist
var tracklist_name
var tracklist_date
// Button clicked
chrome.browserAction.onClicked.addListener(function (tab){
    chrome.tabs.executeScript({
        file: "/bbc2spotify.js"
    })

    get_url = "https://accounts.spotify.com/authorize?"
    get_url += `client_id=${client_id}&`
    get_url += "response_type=code&"
    get_url += `redirect_uri=${encodeURIComponent(chrome.identity.getRedirectURL())}&`
    get_url += "scope=playlist-modify-public"
})

// On playlist scan finish
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.type == "tracklist"){
            sendResponse({farewell: "recieved tracklist"});
            console.log(request.track_list)
            tracklist = request.track_list
            tracklist_name = request.name
            tracklist_date = request.date

            chrome.identity.launchWebAuthFlow(
                {
                    url: get_url,
                    interactive: true,
                }, authenticateSpotify)
        }
    }
);

function authenticateSpotify(response){
    var urlParams = new URLSearchParams(response.replace(chrome.identity.getRedirectURL(), ''))
    console.log(urlParams.get("code"))

    var authRequest = new Request("https://accounts.spotify.com/api/token",
    {
        method: "POST",
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
        },
        body: new URLSearchParams(
        { 
        'grant_type': 'authorization_code', 
        'code': urlParams.get("code"), 
        'redirect_uri': chrome.identity.getRedirectURL(),
        'client_id': `${client_id}`,
        'client_secret': `${client_secret}`
        }) 
    })

    fetch(authRequest).then(function(response){
        response.json().then(function(json){
            createPlaylist(json.access_token)
        })
    })
}

async function createPlaylist(access_token){
    id = await getSpotifyID(access_token)
    console.log(id)
    var trackURIS = []
    for (var track of Object.values(tracklist)){
        trackURIS.push(`"spotify:track:${track.replace("https://open.spotify.com/track/", "")}"`)
    }
    console.log(trackURIS)

    var request = new Request(`https://api.spotify.com/v1/users/${id}/playlists`,
    {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${access_token}`,
            "Content-Type": "application/json"
        },
        body: 
`{
    "name": "${tracklist_name} | ${tracklist_date}",
    "description": "Made using Sounds2Spotify"
}`
    })

    var response = await fetch(request)
    const responseJSON = await response.json()
    const playlistID = await responseJSON.id

    var request = new Request(`https://api.spotify.com/v1/playlists/${playlistID}/tracks`,
    {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access_token}`
        },
        body: 
`{
    "uris": [${trackURIS}]
}`
    })

    var response = await fetch(request)

    chrome.tabs.create({ url: `https://open.spotify.com/playlist/${playlistID}`})

}

async function getSpotifyID(access_token){
    var userRequest = new Request("https://api.spotify.com/v1/me",
    {
        method: "GET",
        headers: {
            Authorization: `Bearer ${access_token}`
        }
    })
    const response = await fetch(userRequest)
    const json = await response.json()
    return json.id
}