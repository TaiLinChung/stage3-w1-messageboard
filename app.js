const dotenv = require('dotenv');
dotenv.config();
const AWS = require('aws-sdk');

const express = require("express");
const app = express();
const path = require("path");

// const multer  = require('multer');
// const upload = multer()


const bodyParser = require("body-parser");
// middleware
app.use(bodyParser.urlencoded({extended:true}));
// app.use(bodyParser.json());
app.use(bodyParser.json({limit: '5000mb'}));
app.use(bodyParser.urlencoded({limit: '5000mb', extended: true}));

//serving a static file
//middleware
app.use(express.static("public"));


//首頁GET
//handle diggerent request
app.get("/",(req,res) => {
    // res.sendFile(path.join(__dirname,"index.html"));
    res.render("index.ejs");
})

app.get("/loadGraphicMessage", async (req,res) => {
    const connection = mysql.createConnection({
        host: process.env.host,
        port : process.env.port,
        user: process.env.user,
        password: process.env.password,
        database : process.env.database
    });
    var sql = "SELECT * FROM graphicMessageTable";
    connection.query(sql,function(err,result){
        if(err){
            console.log(err.message);
            return;
        }
        res.send(result);

    });
    connection.end();
})


app.put("/getData", async (req,res) => {
    try{
        const graphicMessage = req.body;
        const comment = graphicMessage.comment;
        const pictureUrl = graphicMessage.pictureUrl;
        //=======   圖文缺一不可    =======
        if(comment == "" || pictureUrl == ""){
            res.send({"error" : true ,"message":"圖文缺一不可"})
            return
        }

        const type = pictureUrl.match(/data:(.*);base64/)[1];
        const imageBuffer = Buffer.from(pictureUrl.replace(/^data:image\/\w+;base64,/, ""), 'base64');

        const region = process.env.AWS_region;
        const bucketName = process.env.AWS_S3_bucketName;
        const accessKeyId = process.env.AWS_accessKeyId;
        const secretAccessKey = process.env.AWS_secretAccessKey;
        AWS.config.update({
            accessKeyId : accessKeyId,
            secretAccessKey : secretAccessKey,
            region : region
        })
        const s3 = new AWS.S3();
        
        function _uuid() {
            var d = Date.now();
            if (typeof performance !== 'undefined' && typeof performance.now === 'function'){
              d += performance.now(); //use high-precision timer if available
            }
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
              var r = (d + Math.random() * 16) % 16 | 0;
              d = Math.floor(d / 16);
                return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
            });
        }


        const s3PictureName = _uuid();
        const params = {
            Bucket : bucketName,
            Key : `pictures/${s3PictureName}`,
            Body : imageBuffer,
            ContentEncoding : "base64",
            ContentType : type
        }

        // 上傳的部分
        s3.upload(params,(err,) => {
            if(err){
                console.log(err);
                res.send({"error" : true, "message" : "上傳s3失敗"})
            }else{
                // ==============  成功上傳S3轉cloudFront型式 ==============
                RDSUrl = "doumq0p9cu8fw.cloudfront.net" + `/pictures/${s3PictureName}`;
                // ==============  RDS ==============
                deliverToRDS(RDSUrl,comment);

                res.send({
                    "response_code" : 200,
                    "response_message" : "Success",
                    "response_data" : {
                                        "graphic" : RDSUrl,
                                        "message" : comment
                                    },
                    // "response_RDSUrl" : RDSUrl,
                    // "response_comment" : comment
                })
            }
            
        })
    }
    catch{
        console.log("error");
    }
});


//  ========    圖文上傳RDS     =======
const mysql = require('mysql');
function deliverToRDS(RDSUrl,comment){
    try{
        const connection = mysql.createConnection({
            host: process.env.host,
            port : process.env.port,
            user: process.env.user,
            password: process.env.password,
            database : process.env.database
        });
        connection.connect(function(err) {
            if (err) throw err;
            var sql = "INSERT INTO graphicMessageTable (graphic,message) VALUES ('"+RDSUrl+"','"+comment+"')";
            connection.query(sql, function (err, result) {
                if (err) throw err;
                console.log("1 record inserted");
            });
            connection.end();
        });
    }
    catch{
        console.log("deliverToRDS上傳失敗");
        res.send({"error" : true, "message" : "deliverToRDS上傳失敗"})
    }
}



// //  ========    RDS抓取圖文     =======
// function selectAllGraphicMessage(){
//     try{
//         console.log("抓");
//         const connection = mysql.createConnection({
//             host: process.env.host,
//             port : process.env.port,
//             user: process.env.user,
//             password: process.env.password,
//             database : process.env.database
//         });
//         var sql = "SELECT * FROM graphicMessageTable";
//         connection.query(sql,function(err,result){
//             if(err){
//                 console.log(err.message);
//                 return;
//             }
//             console.log('--------------------------SELECT----------------------------');
//             // console.log(result);
//             return result
//             console.log('------------------------------------------------------------\n\n');
//         });
//         connection.end();
//     }
//     catch{
//         console.log("deliverToRDS上傳失敗");
//         res.send({"error" : true, "message" : "deliverToRDS上傳失敗"})
//     }
// }



// const mysql = require('mysql');
// const connection = mysql.createConnection({
//     host: process.env.host,
//     user: process.env.user,
//     port : 3306,
//     password: process.env.password,
//     database: process.env.database
// });

// connection.connect();
 
// connection.query('SELECT 1 + 1 AS solution', function (error, results, fields) {
//   if (error) throw error;
//   console.log('The solution is: ', results[0].solution);
// }
// connect.end();

// );

//===============
// const mysql = require('mysql');

// const connection = mysql.createConnection({
//     host: process.env.host,
//     user: process.env.user,
//     password: process.env.password,
//     port : 3306
// });
// connection.connect();
// connection.connect(function(err) {
//   if (err) throw err;
//   console.log("Connected!");
//   connection.query("CREATE DATABASE mydb", function (err, result) {
//     if (err) throw err;
//     console.log("Database created");
//   });
// });
// connection.end();
// connection.connect();
 
// connection.query('SELECT 1 + 1 AS solution', function (error, results, fields) {
//   if (error) throw error;
//   console.log('The solution is: ', results[0].solution);
// });


// connection.end();



// //============================= 以下修改


// const connection = mysql.createConnection({
//     host: process.env.host,
//     user: process.env.user,
//     password: process.env.password,
//     port : 3306
// });


// const mysql = require('mysql');
// function createConnection(){
//     const connection = mysql.createConnection({
//         host: process.env.host,
//         user: process.env.user,
//         password: process.env.password,
//         port : 3306
//     })
//     return connection;
// }
// module.exports.createConnection = createConnection;







//==================================
// const { ReplicationTimeStatus } = require("@aws-sdk/client-s3");




// function uploadData(req){
//     const data = req.body;
//     const comment = data.comment;
//     const pictureUrl = data.pictureUrl;
//     // console.log(pictureUrl);
//     const type = pictureUrl.match(/data:(.*);base64/)[1];
//     console.log(type);
//     // console.log(pictureUrl);
//     const imageBuffer = Buffer.from(pictureUrl.replace(/^data:image\/\w+;base64,/, ""), 'base64');
//     // console.log(imageBuffer);
//     // const type = imageBuffer;
//     // console.log(type);
//     // console.log(imageBuffer.split(";")[0]);

//     // const region = process.env.AWS_region;
//     // const bucketName = process.env.AWS_S3_bucketName;
//     // const accessKeyId = process.env.AWS_accessKeyId;
//     // const secretAccessKey = process.env.AWS_secretAccessKey;
    
//     // const s3 = new AWS.S3({
//     //     accessKeyId: accessKeyId,
//     //     secretAccessKey: secretAccessKey,
//     // });

//     const time = new Date().getTime();
//     const region = process.env.AWS_region;
//     const bucketName = process.env.AWS_S3_bucketName;
//     const accessKeyId = process.env.AWS_accessKeyId;
//     const secretAccessKey = process.env.AWS_secretAccessKey;

//     AWS.config.update({
//         accessKeyId : accessKeyId,
//         secretAccessKey : secretAccessKey,
//         region : region
//     })

//     const s3 = new AWS.S3();

//     const params = {
//         Bucket : bucketName,
//         Key : "pictures/123",
//         Body : imageBuffer,
//         ContentEncoding : "base64",
//         ContentType : type
//     }

//     s3.upload(params,(err,data) => {
//         if(err){
//             res.send({"error" : true})
//         }else{
//             res.send({
//                 "response_code" : 200,
//                 "response_message" : "Success",
//                 "response_data" : data
//             })
//         }
        
//     })



//     // console.log("GoodDone");
//     // console.log(imageBuffer);
//     // s3.upload({
//     //     Bucket : bucketName,
//     //     Key : "pictures/123",
//     //     Body : imageBuffer,
//     //     ContentEncoding : "base64",
//     //     ContentType : type
//     // })


// }









// //handle diggerent request
// app.get("/",(req,res) => {
//     // res.sendFile(path.join(__dirname,"index.html"));
//     let { wordInput } = req.query;
//     console.log(wordInput);
//     // console.log(req.files);
//     res.render("index.ejs");
// })

// //routing for query
// app.post("/functionForm",(req,res) => {
//     console.log(req.body);
//     console.log(req.files);
//     // let formData = req.body;
//     // res.send("Thanks for posting.");
//     // res.sendFile(path.join(__dirname,"index.html"));
// });



app.listen(3000, () => {
    console.log("Server is running on port 3000.");
});



// require('dotenv').config();
// // console.log(process.env.AWS_accessKeyId);
// // You can either "yarn add aws-sdk" or "npm i aws-sdk"
// const AWS = require('aws-sdk');
// // // Configure AWS with your access and secret key.
// const { AWS_accessKeyId, AWS_secretAccessKey, AWS_region, AWS_S3_bucketName } = process.env;
// // // Configure AWS to use promise
// // AWS.config.setPromisesDependency(require('bluebird'));
// AWS.config.update({ accessKeyId: process.env.AWS_accessKeyId, AWS_secretAccessKey: process.env.SECRET_ACCESS_KEY, region: process.env.AWS_region });
// // // Create an s3 instance
// const s3 = new AWS.S3();
// // With this setup, each time your user uploads an image, will be overwritten.
//   // To prevent this, use a different Key each time.
//   // This won't be needed if they're uploading their avatar, hence the filename, userAvatar.js.
// const params = {
//     Bucket: AWS_S3_bucketName,
//     Key: `${userId}.${type}`, // type is not required
//     Body: base64Data,
//     ACL: 'public-read',
//     ContentEncoding: 'base64', // required
//     ContentType: `image/${type}` // required. Notice the back ticks
// }




