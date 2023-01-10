import inquirer from "inquirer";
import fs from "fs";

module.exports = () => {
    const questions = [
        {
            title: "filePath",
            type : "input",
            message: "Enter the path for the file",
            validate : (path) => {
                if(fs.existsSync(path))
                {
                    return true;
                }else{
                    return "Couldn't find the file, please check again"
                }
            }
        }
    ]


    return inquirer.prompt(questions)
}