const sqlite3 = require("sqlite3").verbose();


// ===============================
// SQLite接続
// ===============================


const db =
new sqlite3.Database(
 "memory.db",
 err=>{

 if(err){

  console.error(
   "SQLite Error:",
   err
  );

 }
 else{

  console.log(
   "SQLite connected"
  );

 }

});



// ===============================
// 安定化設定
// ===============================


db.serialize(()=>{


db.run(
"PRAGMA journal_mode=WAL;"
);



});





// ===============================
// 初期テーブル作成
// ===============================


function initDatabase(){


db.serialize(()=>{


// 会話履歴

db.run(`

CREATE TABLE IF NOT EXISTS chats(

id INTEGER PRIMARY KEY AUTOINCREMENT,

user_id TEXT NOT NULL,

message TEXT NOT NULL,

reply TEXT NOT NULL,

created_at DATETIME DEFAULT CURRENT_TIMESTAMP

)

`);





// 記憶

db.run(`

CREATE TABLE IF NOT EXISTS memories(

id INTEGER PRIMARY KEY AUTOINCREMENT,

user_id TEXT NOT NULL,

key TEXT NOT NULL,

value TEXT NOT NULL,

created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

UNIQUE(user_id,key)

)

`);




});


console.log(
"Database initialized"
);


}




// ===============================
// 会話保存
// ===============================


function saveChat(
userId,
message,
reply
){


return new Promise(
(resolve,reject)=>{


db.run(

`

INSERT INTO chats

(
user_id,
message,
reply
)

VALUES(?,?,?)

`,

[

userId,

message,

reply

],


err=>{


if(err){

console.error(
"Save chat error:",
err
);

reject(err);

}
else{

resolve();

}


}



);


}

);


}





// ===============================
// 会話履歴取得
// ===============================


function getHistory(
userId
){


return new Promise(
(resolve,reject)=>{


db.all(

`

SELECT

message,

reply

FROM chats


WHERE user_id=?


ORDER BY id DESC


LIMIT 10


`,

[

userId

],


(err,rows)=>{


if(err){


console.error(
"History error:",
err
);


resolve([]);


}
else{


resolve(
rows.reverse()
);


}


}


);


}


);


}





// ===============================
// 終了処理
// ===============================


function closeDatabase(){


db.close(
err=>{

if(err){

console.error(err);

}

else{

console.log(
"SQLite closed"
);

}

});


}





module.exports={


initDatabase,

saveChat,

getHistory,

closeDatabase


};