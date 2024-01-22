
async function postData(url = "", data = {}) {  
    // Default options are marked with *
    const response = await fetch(url, {
      method: "POST", // *GET, POST, PUT, DELETE, etc.
      mode: "cors", // no-cors, *cors, same-origin
      cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
      
      headers: {
        "Content-Type": "application/json",
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
      
      body: JSON.stringify(data),
    });
}
function processed_elements(){
    this.processing_array = [];
    this.push = function(value){
        if(value.url==undefined || value.url == 'undefined'){
            return;
        }
        this.processing_array.push(value);
        if(this.processing_array.length == 5){
            let sendToAPI = this.processing_array;
            this.processing_array = [];
            console.log("Send to API")
            console.log(sendToAPI);
            postData("http://localhost:3001/extension-data",sendToAPI)
        }
    }
}
function processing_tabs(){
    
    this.processing_elements = {};
        
    this.processed_elements = new processed_elements();
        
    this.add_first = function(details){
        //add elements when the extension reloads
        console.log(details)
        if(!details || !details.id){
            return;
        }
        let obj = {
            url: details.pending_url + details.url,
            timeStamp: details.timeStamp,
            id: details.id,
            title: details.title,
            startTime: new Date().toLocaleString()
        };
        this.processing_elements[details.id] = obj;
    }
    this.add = function(details){
        //console.log(details)
        if(!details || !details.tabId || (details.frameType != 'outermost_frame') ){
            return;
        }

        this.processing_elements[details.tabId] = {...this.processing_elements[details.tabId], completionTime: new Date().toLocaleString()}
        this.processed_elements.push(this.processing_elements[details.tabId]);
        delete this.processing_elements[details.tabId];
        
        let obj = {
            url: details.url,
            timeStamp: details.timeStamp,
            id: details.tabId,
            title: details.title,
            startTime: new Date().toLocaleString()
        }
        this.processing_elements[details.tabId] = obj
    }
    this.close = function(id){
        //console.log('30')
        
        this.processing_elements[id] = {...this.processing_elements[id], completionTime: new Date().toLocaleDateString()}
        this.processed_elements.push(this.processing_elements[id]);
        delete this.processing_elements[id]
    }

}
const pt = new processing_tabs();
chrome.windows.getAll((window) => {
    chrome.tabs.query({currentWindow: window.id},(details)=>{
        console.log('query')
        console.log(details)
        for(let detail of details)
            pt.add_first(detail);
    })
})
chrome.webNavigation.onCompleted.addListener(async (details) => {
    console.log('Web Navigation')
    console.log(details)
    const tab = await chrome.tabs.get(details.tabId);
    const title = tab.title;
    details = {...details,title: title};
    console.log(details)
    pt.add(details);
});
chrome.tabs.onRemoved.addListener((tabId,details)=>{
    pt.close(tabId);
})
chrome.tabs.onCreated.addListener((tab)=>{
    console.log('Add first')
    console.log(tab)
    pt.add_first(tab);

})
//console.log('57');