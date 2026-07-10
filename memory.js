const sqlite3 = require("sqlite3").verbose();

const {
    saveMemoryMCP,
    getMemoryMCP
} = require("./mcp-client");


// ===============================
// SQLite接続
// ===============================

const db =
new sqlite3.Database(
 "memory.db",
 err => {

  if(err){

   console.error(
    "SQLite Error:",
    err
   );

  }

 }

);



// ===============================
// 記憶保存（MCP版）
// ===============================

async function saveMemory(
 userId,
 key,
 value
){

 try {


  console.log(
   "Memory MCP save:",
   userId,
   key,
   value
  );


  const result =
  await saveMemoryMCP(
   userId,
   key,
   value
  );


  console.log(
   "Memory MCP save result:",
   result
  );


  return result;


 }
 catch(error){


  console.error(
   "Memory MCP save error:",
   error
  );


  return null;


 }

}





// ===============================
// 記憶取得（MCP版）
// ===============================

async function getMemory(
 userId
){

 try {


  console.log(
   "Memory MCP get:",
   userId
  );


  const result =
  await getMemoryMCP(
   userId
  );


  console.log(
   "Memory MCP get result:",
   result
  );


  return result;


 }
 catch(error){


  console.error(
   "Memory MCP get error:",
   error
  );


  return [];


 }

}





// ===============================
// 名前取得（MCP版）
// ===============================
async function findName(userId) {

  try {

    console.log(
      "findName MCP userId =",
      userId
    );


    const result =
    await getMemoryMCP(
      userId
    );


    console.log(
      "findName MCP result =",
      result
    );


    if (!result) {

      return null;

    }


    const match =
    result.match(
      /"key":"name".*?"value":"(.*?)"/
    );


    if (match) {

      return match[1];

    }


    return null;


  } catch(error) {


    console.error(
      "findName MCP error:",
      error
    );


    return null;

  }

}




// ===============================
// 記憶削除
// ===============================

function deleteMemory(
 userId,
 key
){

 return new Promise(
  (resolve,reject)=>{


   db.run(

    `
    DELETE FROM memories

    WHERE user_id=?

    AND key=?

    `,

    [
     userId,
     key
    ],


    err=>{


     if(err){

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
// 全記憶削除
// ===============================

function clearMemory(
 userId
){

 return new Promise(
  (resolve,reject)=>{


   db.run(

    `
    DELETE FROM memories

    WHERE user_id=?

    `,

    [
     userId
    ],


    err=>{


     if(err){

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





module.exports = {

 saveMemory,

 getMemory,

 findName,

 deleteMemory,

 clearMemory

};