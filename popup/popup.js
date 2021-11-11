var keys = ["client_id", "client_secret"];

document.addEventListener("DOMContentLoaded", function(){
    var keySubmit = document.getElementById("keySubmit");
    chrome.storage.local.get(keys, function(data) {
        /* find the form fields and set their state from data, for example 
           (depends on the field type - maybe not .value) */
        for (let key of keys) {
          let field = document.getElementById(key);
          if (field.value != "undefined"){
            field.value = data[key];
          }
          else{
              field.value = ""
          }
          field.oninput = saveData;
        }
      });
    // onClick
    keySubmit.addEventListener("click", function(){
        submitKeys();
    })
})

function saveData(e) {
    chrome.storage.local.set({[this.id]: this.value});
}

function submitKeys(){
    var client_id = document.getElementById("client_id").value
    var client_secret = document.getElementById("client_secret").value
    chrome.runtime.sendMessage({type: "api_keys" , client_id: client_id, 
    client_secret: client_secret}, function (response) {
        console.log(response.farewell);
    })
}