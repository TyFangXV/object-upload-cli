import chalk from "chalk";
import figlet from "figlet";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
import fs from "fs";
import clear from "clear";
import inquirer from "inquirer";
import AWS from 'aws-sdk'
import path from 'path'

// ##############################--modules---#######################
const getCurrentDirectoryBase = () => {
  return `${path.dirname(process.cwd())}\\${path.basename(process.cwd())}`;
}

const configs = () => {
  const dir = getCurrentDirectoryBase();
  if(fs.existsSync(`${dir}/dosnic.config.json`))
  {
  }else{
    console.log(chalk.red("No config found"));
    process.exit()
  }
}



//  ########################---config--######################
const importPath = `${getCurrentDirectoryBase()}/dosnic.config.json`;

const config = require(importPath);

// Replace with your own access key ID and secret access key
AWS.config.update({
    accessKeyId: config.access_id,
  });
  
const s3 = new AWS.S3();


//  ########################---code--######################

//request the user to get the file path and validate the existence of the file
const locator = () => {
    const questions = [
        {
            title: "filePath",
            type : "input",
            name: "filePath",
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


//upload the file to the cloud storage 
const uploadFile = (filePath, bucket, key) => {
    const fileContent = fs.readFileSync(filePath);
  
    const params = {
      Bucket: bucket,
      Key: key,
      Body: fileContent,
    };
  
    s3.upload(params, (err, data) => {
      if (err) {
        console.error(`Error: ${err}`);
      } else {
        console.log(`Successfully uploaded ${data.Key} to ${data.Bucket}`);
      }
    });
};


clear();

const main = async() => {
    console.log(chalk.yellow(figlet.textSync("DOSNIC DEV", {horizontalLayout : true})));
    configs();
    const {filePath} = await locator();
    console.log(AWS.config.acm);
    console.log(chalk.greenBright("Uploading..."));


}

main()