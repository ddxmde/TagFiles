# TagFiles

**功能说明：** *给文件添加标签方便搜索。添加文件夹到app，可以给文件夹内的文件/文件夹添加标签，可以通过搜索快速得到文件。*

### 运行和编译

- 环境：
  - vue-cli4
  - vue-cli-plugin-electron-builder
  - element-ui
  - 更多详见 [package.json](./package.json)
- 命令：
  - npm run electron:serve  运行
  - npm run electorn:build  编译
  - 配置在 [vue.config.js](./vue.config.js) 中

### 实现：

根目录下创建 floder-data.json 文件保存 `添加到app的文件夹信息` 和 `各个文件夹的json文件路径`

文件夹及子文件夹下分别创建 `文件夹名-data.json` 来保存文件夹中的文件信息。数据格式如下：

- folders-data.json --所有加入的文件夹(不包含子文件夹)

  存储格式：

  ```json
  {
      "folders":[
          {
              "name":'',
              "path":'',
              "count":0,
              "totoalCount":0
          }
      ],
      "indexData":[
      	"E:\\xxx-data.json",
          "E:\\xxx-data.json"
          ....
      ]
  }
  ```

  

- ${folderName}-data.json --每个文件夹下的索引文件

  存储格式：

  ```json
  {
      "files":[
          {
              "fullName":"xxx.jpg"
              "name":"", // 保存时空缺，运行时计算
              "type":"", // 保存时空缺，运行时计算
              "path":"", // 保存时空缺，运行时计算
              "tags":["",""],
          }
      ],
  	"indexData":[
      	"E:\\xxx-data.json",
          "E:\\xxx-data.json"
          //....全部子文件夹的json地址
      ]
  }
  ```




### 遇到的坑：

- 待总结

