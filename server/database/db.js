require('dotenv').config();

////         Azure DB            //
const sql = require('mssql');

// console.log("DB_SERVER:", process.env.DB_HOST);
// console.log("DB_PORT:", process.env.DB_PORT);
// console.log("DB_USER:", process.env.DB_USER);

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    authentication: {
        type: 'default'
    },
    options: {
        encrypt: true
    }
}

async function queryDB(queryString, params = []) {
    try {
        const poolConnection = await sql.connect(config);
        const request = poolConnection.request();

        // Add parameters to the SQL request
        params.forEach((param, index) => {
            request.input(`param${index}`, param);
        });

        const resultSet = await request.query(queryString);
        poolConnection.close();
        return resultSet.recordset;
    } catch (err) {
        console.error(err.message);
        return null;
    }
}

module.exports = queryDB;


// // Example code to connect to Azure SQL DB // //

// console.log("Starting...");

// async function connectAndQuery() {
//     try {
//         var poolConnection = await sql.connect(config);

//         console.log("Reading rows from the Chores table...");
//         var resultSet = await poolConnection.request().query(`SELECT chore_name FROM Chores`);

//         console.log(`${resultSet.recordset.length} rows returned.`);

//         // Output column headers
//         var columns = "";
//         for (var column in resultSet.recordset.columns) {
//             columns += column + ", ";
//         }
//         console.log("%s\t", columns.substring(0, columns.length - 2));

//         // Output row contents from default record set
//         resultSet.recordset.forEach(row => {
//             console.log("%s", row.chore_name);  // Changed to row.chore_name
//         });

//         // Close connection only when we're certain the application is finished
//         poolConnection.close();
//     } catch (err) {
//         console.error(err.message);
//     }
// }

// connectAndQuery();