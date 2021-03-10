


import fs from 'fs' 
import path from 'path'
 
export default class FileUtils{


   static readJsonFileSync(relativePath){
 
         return JSON.parse(fs.readFileSync(path.resolve()+relativePath, 'utf8')); 
 
    }

}