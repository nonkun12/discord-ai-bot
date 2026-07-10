const {
    saveMemoryMCP,
    getMemoryMCP
} = require("./mcp-client");


async function test(){

    console.log("保存開始");


    const save =
    await saveMemoryMCP(
        "test-user",
        "name",
        "太郎"
    );


    console.log(
        "save result:",
        save
    );


    console.log("取得開始");


    const data =
    await getMemoryMCP(
        "test-user",
        "name"
    );


    console.log(
        "get result:",
        data
    );

}


test();
