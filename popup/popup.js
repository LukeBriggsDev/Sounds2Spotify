document.addEventListener("DOMContentLoaded", function(){
    var keySubmit = document.getElementById("keySubmit");
    
    // onClick
    keySubmit.addEventListener("click", function(){
        submitKeys();
    })
})
function submitKeys(){
    var client_id = document.getElementById("client_id").value
    var client_secret = document.getElementById("client_secret").value
    chrome.runtime.sendMessage({type: "api_keys" , client_id: client_id, 
    client_secret: client_secret}, function (response) {
        console.log(response.farewell);
    })
}