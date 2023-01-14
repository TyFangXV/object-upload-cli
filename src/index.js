import chalk from "chalk";
import figlet from "figlet";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
import fs from "fs";
import clear from "clear";
import inquirer from "inquirer";
import ibm from 'ibm-cos-sdk'
import path from 'path'

// ##############################--modules---#######################
const getCurrentDirectoryBase = () => {
  return `${path.dirname(process.cwd())}\\${path.basename(process.cwd())}`;
}

const configs = () => {
  const dir = getCurrentDirectoryBase();
  if(fs.existsSync(`${dir}/.dosnic.config.json`))
  {
  }else{
    console.log(chalk.red("No config found"));
    process.exit()
  }
}



//  ########################---config--######################
const importPath = `${getCurrentDirectoryBase()}/.dosnic.config.json`;

const config = require(importPath);
// Replace with your own access key ID and secret access key
var creds = {
  endpoint: config.endpoint,
  apiKeyId: config.api_key,
  serviceInstanceId: config.service_id,
};

var cos = new ibm.S3(creds);


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
const uploadFile = (filePath) => {
  try {
      const fileContent = fs.readFileSync(filePath);
      return cos.putObject({
        Bucket: config.bucket,
        Key : config.key_name,
        Body: fileContent
    })
  } catch (error) {
      console.log(error);
      process.exit();
  }
};


clear();

const main = async() => {
    console.log(chalk.yellow(figlet.textSync("DOSNIC DEV", {horizontalLayout : true})));
    configs();
    const {filePath} = await locator();
    console.log(chalk.greenBright("Uploading..."));

    const uploadLog = uploadFile(filePath)
                                  .send((err) => {
                                      if(err) console.log(chalk.redBright(err));
                                      if(!err) console.log(chalk.yellowBright("File has been uploaded"));
                                  });

    console.log(chalk.greenBright("Uploaded"));

}

main()