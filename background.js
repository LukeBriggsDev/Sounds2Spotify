var tracklist
var tracklist_name
var tracklist_date
var get_url

var client_id
var client_secret

// Button clicked
function runScript() {
    // Scan for spotify links
    chrome.tabs.executeScript({
        file: "/bbc2spotify.js"
    })
    // Base URL
    get_url = "https://accounts.spotify.com/authorize?"
    get_url += `client_id=${client_id}&`
    get_url += "response_type=code&"
    get_url += `redirect_uri=${encodeURIComponent(chrome.identity.getRedirectURL())}&`
    get_url += "scope=playlist-modify-public"
}


chrome.runtime.onMessage.addListener(
    // On playlist scan finish 
    function(request, sender, sendResponse) {
        if (request.type == "tracklist"){
            sendResponse({farewell: "recieved tracklist"});

            tracklist = request.track_list
            tracklist_name = request.name
            tracklist_date = request.date

            // Authenticate and make playlist
            chrome.identity.launchWebAuthFlow(
                {
                    url: get_url,
                    interactive: true,
                }, authenticateSpotify)
        }
        // Recieve API details
        if (request.type == "api_keys"){
            sendResponse({farewell: "recieved api_keys"});
            client_id = request.client_id
            client_secret = request.client_secret
            // Start request
            runScript();
        }
    }

    
    

);

// Recieve api details
chrome.runtime.onMessage.add

function authenticateSpotify(response){
    // Get parameters from response
    var urlParams = new URLSearchParams(response.replace(chrome.identity.getRedirectURL(), ''))

    // POST request for access token
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

    // Create playlist
    fetch(authRequest).then(function(response){
        response.json().then(function(json){
            createPlaylist(json.access_token)
        })
    })
}

async function createPlaylist(access_token){

    id = await getSpotifyID(access_token)

    var trackURIS = []
    
    // Add create Spotify URIs from track links
    for (var track of Object.values(tracklist)){
        trackURIS.push(`"${track.replace("https://open.spotify.com/track/", "spotify:track:")}"`)
    }

    // Create new playlist
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

    // Add tracklist songs to newly created playlist
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

    // Open tab to new playlist
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
