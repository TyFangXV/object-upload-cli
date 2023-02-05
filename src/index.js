#!/usr/bin/env node

import xmlParse from 'xml2js'
import chalk from "chalk";
import figlet from "figlet";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
import fs from "fs";
import clear from "clear";
import inquirer from "inquirer";
import ibm from 'ibm-cos-sdk'
import path from 'path'
import axios from 'axios';

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
function create_UUID(){
  var dt = new Date().getTime();
  var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = (dt + Math.random()*16)%16 | 0;
      dt = Math.floor(dt/16);
      return (c=='x' ? r :(r&0x3|0x8)).toString(16);
  });
  return uuid;
}

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
const uploadFile = (filePath, file_name) => {
  try {
      if(filePath.includes("\\")) filePath.replaceAll("\\", "/")
      const fileContent = fs.readFileSync(filePath);
      return cos.putObject({
        Bucket: config.bucket,
        Key : file_name || filePath.split("/").pop(),
        Body: fileContent
    })
  } catch (error) {
      console.log(error);
      process.exit();
  }
};


clear();

const uploader = async() => {
  const file_name_id = create_UUID();
  //generate meta-data file
  if(fs.existsSync("./.dosnic.app_data.json")) fs.rmSync("./.dosnic.app_data.json");
  fs.appendFileSync("./.dosnic.app_data.json", `{app_name : "dosnic", download_file_name : ${file_name_id}.apk}`);
  if(config.file_path && fs.existsSync(config.file_path)) 
  {
    console.log(chalk.greenBright("File path has been mentioned in the config file....uploading it"));
      //upload apk
    uploadFile(config.file_path, `${file_name_id}.apk`)
        .send((err) => {
            if(err) console.log(chalk.redBright(err));
            if(!err) console.log(chalk.bgGreenBright("apk has been uploaded"));
        });
        //upload meta-data
        uploadFile("./.dosnic.app_data.json")
        .send((err) => {
            if(err) console.log(chalk.redBright(err));
            if(!err) console.log(chalk.bgGreenBright("meta-data file has been uploaded"));
            fs.rmSync("./.dosnic.app_data.json");
        });
  }else{
      const {filePath} = await locator();
      console.log(chalk.greenBright("Uploading..."));
      //upload apk
      uploadFile(filePath, `${file_name_id}.apk`)
        .send((err) => {
            if(err) console.log(chalk.redBright(err));
            if(!err) console.log(chalk.bgGreenBright("apk has been uploaded"));
        });

        //upload meta-data
        uploadFile("./.dosnic.app_data.json")
        .send((err) => {
            if(err) console.log(chalk.redBright(err));
            if(!err) console.log(chalk.bgGreenBright("meta-data file has been uploaded"));
            fs.rmSync("./.dosnic.app_data.json");
        });
  }
}


const deleter = async() => {
  try {
      //get the list of files and parse it to json
      const {data} = await axios.get(`https://${config.endpoint}/${config.bucket}`);
      xmlParse.parseString(data, async(err, data) => {
        const itemList = data.ListBucketResult.Contents;
        const items = [];
        //list out all the file
        itemList.map(data => items.push(data.Key[0]))
        const files = [
          {
              title: "filename",
              type : "list",
              name: "filename",
              choices: items,
          }
      ]

      const file = await inquirer.prompt(files);
      console.log(chalk.greenBright("Started deleting the file"));
      cos.deleteObject({
          Bucket: config.bucket,
          Key : file.filename
      }).send((err, data) => {
        if(err) console.log(chalk.redBright(err))
        if(!err) console.log(chalk.yellowBright(`Done deleting ${file.filename}`));
      })
      
      });
  } catch (error) {
    console.log(error);
    console.log(chalk.redBright("Something went wrong.."))
  }
}


//function to run the selected command
const initiator = async(commands) => {
  switch(commands)
  {
    case "Upload File":
      await uploader();
      break;
    case "Delete File":
      await deleter();
      break;
  }
}

const main = async() => {
    console.log(chalk.yellow(figlet.textSync("DOSNIC DEV", {horizontalLayout : true})));
    configs();
    
    //main commands
    const commands = [
      {
          title: "Commands",
          type : "list",
          name: "Commands",
          choices: ["Upload File", "Delete File", "Clear bucket"]
      }
  ]

  const command = await inquirer.prompt(commands);
  console.log(command.Commands);
  initiator(command.Commands)

}

main()