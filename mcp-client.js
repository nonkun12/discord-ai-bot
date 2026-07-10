const axios = require("axios");

const MCP_URL =
    process.env.MCP_URL ||
    "https://my-mcp-server-dqbx.onrender.com";


// ===============================
// MCP save_memory
// ===============================

async function saveMemoryMCP(
    userId,
    key,
    value
){

    try {

        const response =
        await axios.post(

            `${MCP_URL}/mcp`,

            {
                jsonrpc: "2.0",

                id: 1,

                method: "tools/call",

                params: {

                    name: "save_memory",

                    arguments: {

                        userId,

                        key,

                        value

                    }

                }

            },

            {
                headers: {

                    "Content-Type": "application/json",

                    "Accept":
                    "application/json, text/event-stream"

                }

            }

        );


        return response.data;


    } catch(error){

        console.error(
            "MCP save error:",
            error.response?.data ||
            error.message
        );

        return null;

    }

}



// ===============================
// MCP get_memory
// ===============================

async function getMemoryMCP(
    userId,
    key
){

    try {

        const response =
        await axios.post(

            `${MCP_URL}/mcp`,

            {
                jsonrpc: "2.0",

                id: 1,

                method: "tools/call",

                params: {

                    name: "get_memory",

                    arguments: {

                        userId,

                        key

                    }

                }

            },

            {
                headers: {

                    "Content-Type": "application/json",

                    "Accept":
                    "application/json, text/event-stream"

                }

            }

        );


        return response.data;


    } catch(error){

        console.error(
            "MCP get error:",
            error.response?.data ||
            error.message
        );

        return null;

    }

}



module.exports = {

    saveMemoryMCP,

    getMemoryMCP

};
