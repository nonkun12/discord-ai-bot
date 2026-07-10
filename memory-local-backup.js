const sqlite3 = require("sqlite3").verbose();


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
// 記憶保存
// ===============================

function saveMemory(
 userId,
 key,
 value
){

 return new Promise(
  (resolve,reject)=>{


   db.run(

    `
    INSERT INTO memories
    (
      user_id,
      key,
      value
    )

    VALUES(?,?,?)

    ON CONFLICT(user_id,key)

    DO UPDATE SET

    value=excluded.value

    `,

    [
     userId,
     key,
     value
    ],


    function(err){


     if(err){

      console.error(
       "Memory save error:",
       err
      );


      reject(err);


     }
     else{


      console.log(
       "Memory saved:",
       userId,
       key,
       value
      );


      resolve();


     }


    }


   );


  }

 );


}





// ===============================
// 記憶取得
// ===============================

function getMemory(
 userId
){

 return new Promise(
  (resolve)=>{


   db.all(

    `
    SELECT

    key,

    value

    FROM memories

    WHERE user_id=?

    ORDER BY id ASC

    `,

    [
     userId
    ],


    (err,rows)=>{


     if(err){

      console.error(
       "Memory get error:",
       err
      );


      resolve([]);

     }
     else{

      resolve(
       rows
      );

     }


    }


   );


  }

 );

}




// ===============================
// 名前取得
// ===============================

function findName(userId) {
  return new Promise((resolve) => {
    console.log("findName userId =", userId);

    db.get(
      `
      SELECT value
      FROM memories
      WHERE user_id = ?
      AND key = 'name'
      LIMIT 1
      `,
      [userId],
      (err, row) => {
        console.log("findName row =", row);

        if (err) {
          console.error(err);
          resolve(null);
        } else {
          resolve(row ? row.value : null);
        }
      }
    );
  });
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