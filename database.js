
const fs = require("fs");
const path = require("path");

const DB_FILE = path.join(__dirname, "database.json");

function initializeDatabase() {
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(
            DB_FILE,
            JSON.stringify({
                students: [],
                marks: []
            }, null, 2)
        );
    }
}

function getDatabase() {
    initializeDatabase();

    return JSON.parse(
        fs.readFileSync(DB_FILE, "utf8")
    );
}

function saveDatabase(data) {
    fs.writeFileSync(
        DB_FILE,
        JSON.stringify(data, null, 2)
    );
}

module.exports = {
    getDatabase,
    saveDatabase
};
