'use strict'

import {
  app,
  protocol,
  BrowserWindow,
  Menu,
  dialog
} from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'
const isDevelopment = process.env.NODE_ENV !== 'production'

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])
// protocol.interceptFileProtocol('file', (req, callback) => {
//   const url = req.url.substr(8);
//   callback(slash(decodeURI(url)));
// }, (error) => {
//   if (error) {
//     console.error('Failed to register protocol');
//   }
// });
function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({
    width: 960,
    height: 600,
    minWidth: 960,
    minHeight: 600,
    frame: false,
    webPreferences: {
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      //nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION
      nodeIntegration:true,
      webSecurity: false
    }
  })
  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')
  }

  win.on('closed', () => {
    win = null
  })
}
function registerSafeFileProtocol() {
  const safeFileProtocol = `electrondemo-safe-file-protocol`
  protocol.registerFileProtocol(safeFileProtocol, (request, callback) => {
    const url = request.url.replace(`${safeFileProtocol}://`, '')
    // Decode URL to prevent errors when loading filenames with UTF-8 chars or chars like "#"
    const decodedUrl = decodeURIComponent(url)
    try {
      return callback(decodedUrl)
    } catch (error) {
      console.error('ERROR: main | registerSafeFileProtocol | Could not get file path', error)
    }
  })
}
// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  registerSafeFileProtocol()
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS_DEVTOOLS)
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }
  createWindow()
  Menu.setApplicationMenu(null)
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}


const {
  ipcMain
} = require('electron')
// 监听asynchronous-message，接收渲染进程发送的消息
ipcMain.on('toggal-fullscreen', (event, arg) => {
  //console.log(arg) // prints "ping"
  // 回复消息
  //event.reply('asynchronous-reply', 'pong')
    if (win.isMaximized()) {
      win.restore();
    } else {
      win.maximize();
    }
})
ipcMain.on('window-close', (event) => {
  console.log("guanji")
  win.close()
  app.exit()
})

const fs = require('fs');
const path = require("path")

//获取已添加的文件夹
ipcMain.on('get-folders', getFolders)

//选择文件夹添加到系统
ipcMain.on('open-directory-dialog', openDialogAddFolder)

//从系统删除文件夹
ipcMain.on('delete-folder', (event, arg) => {
  deleteFolderJson(arg)
  event.reply("delete-folder-response", null);
})

//根据指定目录路径获取目录下文件
ipcMain.on('get-files',(event,args)=>{
  event.reply("send-files", getFilesFromFolder(args));
})

//更新指定文件的标签
ipcMain.on('update-tags', (event, args) => {
  event.reply("update-tags-response", updateTags(args));
})

//搜索标签，args包含指定的文件夹列表，如果为空则全局搜索
ipcMain.on('search-tags', (event, args) => {
  event.reply("search-tags-response", getFilesByTags(args[0], args[1]));
})

//更新文件夹 - 用户在app以外添加或删除文件之后数据更新
ipcMain.on('update-folders', (event, args) => {
  console.log("进入update-folders")
  updateFolder()
  event.reply("update-folders-response");
})

/**
 * 根据指定文件路径更新文件对应的tag
*/
function updateTags(targetFile){
    // 根据文件 找到文件夹/json 更新json
    //console.log(targetFile)
    var tmp_folder_path = targetFile.path.split(path.sep)
    tmp_folder_path.pop()
    var folder_path = tmp_folder_path.join(path.sep)
    var folder_name = tmp_folder_path.pop()
    var json_path = path.resolve(folder_path, folder_name + "-data.json")
    var json_data = readFromJsonFile(json_path)
    if(json_data==null){
      //json文件被删
      renewJsonFile(json_path)
      json_data = readFromJsonFile(json_path)
    }
    var json_data_files = json_data.files
    for(var i=0;i<json_data_files.length;i++){
      if (json_data_files[i].path == targetFile.path){
        json_data_files[i].tags = targetFile.tags
      }
    }
    json_data.files = json_data_files
    return writeToJsonFile(json_path,json_data)
}

/**
 * 打开资源管理器之后处理选中/取消 事件以及添加文件夹到app
 */
function openDialogAddFolder(event, args) {
  dialog.showOpenDialog({
    properties: [args]
  }).then((rs) => {
    var add_or_not = false
    if (!rs.canceled) { // 如果有选中
      // 发送选择的对象给子进程
      console.log(rs.filePaths[0])
      add_or_not = addFolders(rs.filePaths[0])
    }
    event.reply("add-folders-response", add_or_not)
  })
}

/**
 * 根据app保存到folders-data.json中的数据获取对应的文件夹信息
 */
function getFolders(event, args) {
  var data_json_path = path.resolve('./', 'folders-data.json')
  if(!fs.existsSync(data_json_path)){
      var tmp_jsondata = {}
      tmp_jsondata.folders = []
      tmp_jsondata.indexData = []
      writeToJsonFile(data_json_path, tmp_jsondata)
  }
  var folders = readFromJsonFile(data_json_path, 'folders')
  var new_folders = folders.map((item) => {
    return getDirInfoPath(item.path)
  })
  var sys_data_json = readFromJsonFile(data_json_path)
  sys_data_json.folders = new_folders
  writeToJsonFile(data_json_path, sys_data_json)
  event.reply("send-folders", new_folders);
}

/**
 * 添加指定路径的文件夹target到app
 */
function addFolders(target) {
  var data_json_path = path.resolve('./', 'folders-data.json')
  if(!fs.existsSync(data_json_path)){
      //系统json文件被删
  }
  var cur_folders = readFromJsonFile(data_json_path, 'folders')
  for (var f of cur_folders) {
    if (f.path == target) {
      return null
    }
  }
  var dir_info = getDirInfoPath(target)
  var cur_json_data = readFromJsonFile(data_json_path)
  cur_folders = cur_json_data.folders
  cur_folders.push(dir_info)
  cur_json_data.folders = cur_folders
  cur_json_data.indexData.push(path.resolve(dir_info.path,dir_info.name+"-data.json"))
  return writeToJsonFile(data_json_path, cur_json_data)
}

/**
 * 从指定路径target的json文件中读取指定数据
 * attr为null时读取全部数据
 */
function readFromJsonFile(target, attr = null) {
  var data = {}
  try {
    data = fs.readFileSync(target, "utf-8")
    if(data==null) return null
    var jdata = JSON.parse(data)
    if (attr == null) {
      return jdata
    } else {
      return jdata[attr]
    }
  } catch (error) {
    console.log(error)
    return null
  }
}

/**
 * 向指定路径target的json文件中写入数据
 */
function writeToJsonFile(target, newData) {
  try {
    fs.writeFileSync(target, JSON.stringify(newData), {
      flag: 'w',
      encoding: 'utf8'
    })
    return true
  } catch (error) {
    console.log(error)
    return false
  }
}

/**
 * 获取指定路径target的文件夹的信息
 * 如果文件夹对应的json不存在，则创建json
 * 如果存在，则从json读取
 */
function getDirInfoPath(target) {
  var result = {}
  var _allfiles = fs.readdirSync(target)
  var dir_count = 0
  var file_count = 0
  for (var f of _allfiles) {
    var f_stat = fs.statSync(path.resolve(target, f))
    if (f_stat.isFile()) {
      file_count += 1
    }
    if (f_stat.isDirectory()) {
      dir_count += 1
    }
  }
  var _dirname = target.split(path.sep).pop()
  result['name'] = _dirname
  result['path'] = target
  result['totalCount'] = dir_count + file_count
  var json_data_file_name = _dirname + "-data.json"
  var target_data_json = path.resolve(target, json_data_file_name)
  if (fs.existsSync(target_data_json)) {
    // 如果json文件存在
    var children = readFromJsonFile(target_data_json, "files")
    if (children == null) {
      result['count'] = 0
    }else{
      result['count'] = children.length
    }
    result['totalCount']-=1
  } else {
    //创建一个xxx-data.json文件
    var child_count = createJsonFile(target)
    if (child_count == null) {
      console.log("error")
    } else {
      result['count'] = child_count
    }
  }
  return result
}

/**
 * 为指定文件夹target创建json文件,子文件如果是文件夹，递归创建
 * 所有创建的json文件路径都保存到该文件夹json文件的"indexData"中
 */
function createJsonFile(target, jsonArray = []) {
  var _allfiles = fs.readdirSync(target)
  var dir_count =0
  var file_count = 0
  var tmp_json_data = {}
  var tmp_json_files = []
  for (var f of _allfiles) {
    var f_stat = fs.statSync(path.resolve(target, f))
    var f_name, f_path, f_type, f_tags, f_fullname
    if (f_stat.isFile()) {
      f_path = path.resolve(target, f)
      var parent_name = target.split(path.sep).pop()
      if (path.basename(f_path) == parent_name+"-data.json"){
        continue
      }
      f_type = path.extname(f_path)
      f_name = path.basename(f_path, f_type)
      
      file_count += 1
      f_tags = [f_name, f_type]
    } else {
      dir_count += 1
      f_path = path.resolve(target, f)
      f_name = f_path.split(path.sep).pop()
      f_type = "文件夹"
      f_tags = [f_name, f_type]
      createJsonFile(f_path, jsonArray)
    }
    var tmp_file = {}
    tmp_file['fullName'] = f
    tmp_file['name'] = f_name
    tmp_file['type'] = f_type
    tmp_file['path'] = f_path
    tmp_file['tags'] = f_tags
    tmp_json_files.push(tmp_file)
  }
  tmp_json_data["files"] = tmp_json_files
  tmp_json_data["indexData"] = jsonArray
  var _dirname = target.split(path.sep).pop()
  var json_path = path.resolve(target, _dirname + "-data.json")

  fs.writeFileSync(json_path, JSON.stringify(tmp_json_data), {
      flag: 'w',
      encoding: 'utf8'
      })
  jsonArray.push(json_path)
  return tmp_json_files.length
}

/**
 * 为文件夹重建json文件
 */
function renewJsonFile(jsonPath) {
  var tmp_arr = jsonPath.split(path.sep)
  tmp_arr.pop()
  var folderPath = tmp_arr.join(path.sep)
  var tmp_json_data = {}
  var tmp_json_files = getRealFilesFromFolder(folderPath)
  tmp_json_data.files = tmp_json_files
  tmp_json_data.indexData = []
  return writeToJsonFile(jsonPath,tmp_json_data)
}

/**
 * 从指定路径target的文件夹下读取全部文件--从硬盘文件夹中读取
 */
function getRealFilesFromFolder(target) {
  var _allfiles = fs.readdirSync(target)
  var result = []
  for (var f of _allfiles) {
    var f_stat = fs.statSync(path.resolve(target, f))
    var f_name, f_path, f_type, f_tags, f_fullname
    if(f_stat.isFile){
        f_path = path.resolve(target, f)
        var parent_name = target.split(path.sep).pop()
        if (path.basename(f_path) == parent_name + "-data.json") {
          continue
        }
        f_type = path.extname(f_path)
        f_name = path.basename(f_path, f_type)
        f_tags = [f_name, f_type]
    }else{
        f_path = path.resolve(target, f)
        f_name = f_path.split(path.sep).pop()
        f_type = "文件夹"
        f_tags = [f_name, f_type]
    }
    var tmp_file = {}
    tmp_file['fullName'] = f
    tmp_file['name'] = f_name
    tmp_file['type'] = f_type
    tmp_file['path'] = f_path
    tmp_file['tags'] = f_tags
    result.push(tmp_file)
  }
  return result
}

/**
 * 删除文件夹及子文件夹下面的全部对应的json文件
 */
function deleteFolderJson(target){
  var _dirname = target.split(path.sep).pop()
  var json_data_file_name = _dirname + "-data.json"
  var target_data_json = path.resolve(target, json_data_file_name)
  if (fs.existsSync(target_data_json)) {
    var children = readFromJsonFile(target_data_json, "indexData")
    for(var childPath of children){
      if(fs.existsSync(childPath)){
        fs.unlinkSync(childPath)
      }
    }
    fs.unlinkSync(target_data_json)
  }
  var sys_data_json = path.resolve('./', 'folders-data.json')
  var cur_sys_data = readFromJsonFile(sys_data_json)
  var cur_sys_folders = cur_sys_data.folders
  var cur_sys_indexdata = cur_sys_data.indexData
  cur_sys_data.folders = cur_sys_folders.filter((item) => {
      var rs = item.path != target
      return rs
  })
  cur_sys_data.indexData = cur_sys_indexdata.filter((item)=>{
      return item.indexOf(target)!=0
  })
  writeToJsonFile(sys_data_json,cur_sys_data)
}

/**
 * 从指定路径target的文件夹下读取全部文件--从json文件中读
 * 如果子文件是文件夹，则获取文件夹信息(实际文件数，保存到json的文件数)
 */
function getFilesFromFolder(target) {
  var _dirname = target.split(path.sep).pop()
  var json_data_file_name = _dirname + "-data.json"
  var files = readFromJsonFile(path.resolve(target,json_data_file_name), "files")
  if(files!=null){
      for (var i = 0; i < files.length; i++) {
        if (files[i].type == "文件夹") {
          files[i].info = getDirInfoPath(files[i].path)
        }
      }
  }
  return files
}


/**
 * 向指定路径target的json文件中的'files'添加数据
 */
function writeFilesToFolderJson(target,newFiles){
  try {
    var _dirname = target.split(path.sep).pop()
    var json_data_file_name = _dirname + "-data.json"
    var json_path = path.resolve(target, json_data_file_name)
    var json_data = readFromJsonFile(json_path)
    json_data.files = newFiles
    writeToJsonFile(json_path, json_data)
    return true
  } catch (error) {
    return false
  }
}

/**
 *  更新全部文件夹json数据
 */
function updateFolder() {
  var data_json_path = path.resolve('./', 'folders-data.json')
  var cur_folders = readFromJsonFile(data_json_path, 'folders')
  for (var sysfolder of cur_folders) {
    // 用户添加的文件夹下面的json中indexData中包含所有子文件json
    var cur_file_name = sysfolder.path.split(path.sep).pop() + "-data.json"
    var cur_json_path = path.resolve(sysfolder.path, cur_file_name)
    var cur_indexData = readFromJsonFile(cur_json_path,"indexData")
    console.log("更新" + cur_json_path)
    if (!fs.existsSync(cur_json_path)){
        //主文件夹json文件丢失事情就大了，得全部重建
        createJsonFile(sysfolder)
    }else{
        updateByJsonPath(cur_json_path)
        for (var jfile of cur_indexData) {
          //子文件夹json文件丢失，重建
          if (!fs.existsSync(jfile)) {
            renewJsonFile(jfile)
          } else {
            updateByJsonPath(jfile)
          }
        }
    }
  }
}



/**
 * 更新指定路径target的json文件数据
 */
function updateByJsonPath(target){
    // "xx/xxx/xx-data.json" success-true error-false
    var folderPath = target.split(path.sep)
    var target_name = folderPath.pop()
    folderPath = folderPath.join(path.sep)
    if (!fs.existsSync(folderPath)){
      return
    }
    var children = fs.readdirSync(folderPath)
    children = children.filter(child=>{
        return child != target_name
    })
    var JsonData = readFromJsonFile(target)
    var newJsonData = {}
    newJsonData['files']=[]
    newJsonData['indexData'] = JsonData.indexData
    var tmpFileArr = []
    for(var child of children){
        var tmp_child_info = null
        if(JsonData.files!=null){
            for (var jsonChild of JsonData.files){
              if(child == jsonChild.fullName){
                 tmp_child_info =jsonChild
                  break
              }
            }
        }
        if(tmp_child_info==null){
            console.log("新增" + child)
            tmp_child_info = getFileInfoFromPath(folderPath, child)
            if (tmp_child_info.type == "文件夹"){
                var child_json_name = path.resolve(tmp_child_info.path ,tmp_child_info.fullName+"-data.json")
                newJsonData['indexData'].push(child_json_name)
            }
        }
        newJsonData['files'].push(tmp_child_info)
        
    }
    return writeToJsonFile(target, newJsonData)
}

/**
 * 根据文件夹路径获取指定文件信息
 */
function getFileInfoFromPath(folderPath,target){
    var f_name,f_type,f_path,f_tags
    var f_desc={}
    f_path = path.resolve(folderPath, target)

    var f_stat = fs.statSync(f_path)
    if(f_stat.isFile()){
        f_type = path.extname(f_path)
        f_name = path.basename(f_path, f_type)
    }else{
        f_type = "文件夹"
        f_name = target
    }
    f_tags = [f_name, f_type]

    f_desc['fullName'] = target
    f_desc['name'] = f_name
    f_desc['type'] = f_type
    f_desc['path'] = f_path
    f_desc['tags'] = f_tags
    return f_desc
}

/**
 * 在指定文件夹列表中查找全部和制定标签列表tags有交集的文件
 */
function getFilesByTags(folders,tags){
    var result = []
    if(folders.length==0){
      //找出全局json
      var data_json_path = path.resolve('./', 'folders-data.json')
      var cur_jsons = readFromJsonFile(data_json_path, 'indexData')
      for (var jp of cur_jsons){
          result = result.concat(getFileFromJsonByTags(jp,tags))
          var cur_indexdatas = readFromJsonFile(jp, 'indexData')
          for (var cur_child of cur_indexdatas){
            result = result.concat(getFileFromJsonByTags(cur_child, tags))
          }
      }
    }else{
        for(var folder of folders){
            var cur_f_json = path.resolve(folder.path,folder.name+"-data.json")
            result = result.concat(getFileFromJsonByTags(cur_f_json, tags))
            var cur_indexdatas = readFromJsonFile(cur_f_json, 'indexData')
            for (var cur_child of cur_indexdatas) {
              result = result.concat(getFileFromJsonByTags(cur_child, tags))
            }
        }
    }
    return result
}

/**
 * 从指定json中查找和tags有交集的文件
 */
function getFileFromJsonByTags(target,tags){
    var result = []
    var cur_files = readFromJsonFile(target, 'files')
    
    for (var f of cur_files){
      var cur_file_tags = f.tags.join(" ")
      
      if (hasSubin(tags, cur_file_tags)) {
        if(f.type=="文件夹")
          f.info = getDirInfoPath(f.path)
        result.push(f)
      }
    }
    return result
}

/**
 * 如果arrA和arrB两个数组有交集，返回true否则返回false
 */
function hasIntersection(arrA,arrB){
    //判断两个数组是否有交集
    for(var a of arrA){
      if(arrB.includes(a)) return true
    }
    return false
}

/**
 * 如果arr数组中的元素在字符串tar中存在返回true否则返回false
 */
function hasSubin(arr,tar){
  for(var a of arr){
    if(tar.indexOf(a)>-1){
      return true
    }
  }
  return false
}