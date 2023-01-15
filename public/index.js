
// 將檔案轉成Base64等同Url的東西
let pictureUrl="";
let pictureType="";
const pictureInput = document.querySelector("#pictureInput")
pictureInput.addEventListener("change", e => {
    // // console.log(e.target.files[0]);
    // // console.log(pictureInput.files[0]);
    //毛毛寫法
    const picture = e.target.files[0]; // 取得file Object
    const reader = new FileReader();
    reader.addEventListener("load", () => { // load 時可以取得 fileReader 回傳的結果
        pictureUrl=reader.result;
    });
    reader.readAsDataURL(picture);


    // // 子兆寫法 建立新的 FileReader 物件
    // var reader = new FileReader();

    // // 建立 Blob 物件
    // var blob = new Blob(pictureInput.files, { type: "text/plain" });
    // // console.log(blob);
    // // 讀取 Blob 的內容為 ArrayBuffer
    // reader.readAsArrayBuffer(blob);

    // // 將 onload 事件附加到載入事件
    // reader.onload = function() {
    // // result 屬性包含 ArrayBuffer
    // var arrayBuffer = reader.result;
    // // Convert the ArrayBuffer to a Uint8Array
    // var uint8Array = new Uint8Array(arrayBuffer);
    // console.log(arrayBuffer);
    // console.log("-----");
    // console.log(uint8Array);
    // };
});



const submit = document.querySelector(".submit");
submit.addEventListener("click", async () => {
    let commentInput = document.querySelector("#commentInput").value;
    // console.log(pictureUrl);
    if(commentInput == "" || pictureUrl == ""){
        alert("圖文缺一不可");
        return
    }
    putMessage(pictureUrl,commentInput);
});


//============  載入畫面時先去RDS獲取資料    ============
async function loadGraphicMessage() {
    try {
        const response = await fetch("/loadGraphicMessage", {
            method: "GET",          
            headers: new Headers({
                "content-type": "application/json"
            })
        });
        const data = await response.json();
        buildTheFirstPage(data);
    } catch (error) {
        console.error(error);
    }
}
loadGraphicMessage();



async function putMessage(pictureUrl, commentInput) {
    try {
        const response = await fetch("/getData", {
            method: "PUT",
            body: JSON.stringify({
                "comment": String(commentInput),
                "pictureUrl": pictureUrl
            }),
            
            headers: new Headers({
                "content-type": "application/json"
            })
        });
        const responseTransfer = await response.json();
        const data = [{
                        "message" : responseTransfer.response_data.message,
                        "graphic" : responseTransfer.response_data.graphic
                    }];
        
        buildTheFirstPage(data);
        let listOfAllGraphicMessage = document.querySelectorAll(".messageBlock");
        if(listOfAllGraphicMessage.length>=2){
            const firstGraphicMessage = listOfAllGraphicMessage[0];
            const endGraphicMessage = listOfAllGraphicMessage[listOfAllGraphicMessage.length-1];
            firstGraphicMessage.insertAdjacentElement("beforebegin", endGraphicMessage);
        }
        
        } catch (error) {
        console.error(error);
    }
}




function buildTheFirstPage(data){
    const length = data.length;
    // console.log(data[0]);
    // console.log(data.length);
    for(i=length-1;i>=0;i--){
        // console.log(i);
        // console.log(data[i]);
        const functionContainer = document.querySelector(".functionContainer");
        const messageBlock = document.createElement("div");
        messageBlock.setAttribute("class","messageBlock");
        const hrLine = document.createElement("hr");
        hrLine.setAttribute("class","hrLine");
        const wordBlock = document.createElement("div");
        wordBlock.setAttribute("class","wordBlock");
        const messageWord = document.createElement("div");
        messageWord.setAttribute("class","messageWord");
        messageWord.textContent = data[i].message;
        const pictureBlock = document.createElement("div");
        pictureBlock.setAttribute("class","pictureBlock");
        const messagePicture = document.createElement("img");
        messagePicture.setAttribute("class","messagePicture");
        messagePicture.setAttribute("src","https://"+data[i].graphic);
        
        messageBlock.appendChild(hrLine);
        wordBlock.appendChild(messageWord);
        messageBlock.appendChild(wordBlock);
        pictureBlock.appendChild(messagePicture);
        messageBlock.appendChild(pictureBlock);
        
        functionContainer.appendChild(messageBlock);
        

    }
}









// 舊fetch
// function putMessage(pictureUrl,commentInput){
//     fetch("/getData",{
//         method:"PUT",
//         body:JSON.stringify({
//             "comment":String(commentInput),
//             "pictureUrl":pictureUrl
//     }),
//         headers:new Headers({
//             "content-type":"application/json"
//         })
//     }).then(function(response){
//         return response.json();
//     }).then(function(data){
//         console.log(data);

//     })
// }


