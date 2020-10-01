# TagFiles

**功能说明：** *给文件添加标签方便搜索。添加文件夹到app，可以给文件夹内的文件/文件夹添加标签，可以通过搜索快速得到文件。*

**计划：** 替代资源管理器

[**界面及下载安装包**](https://github.com/ddxmde/TagFiles/releases/tag/v0.1.2)

### 更新v0.1.2

- 修复文件夹在硬盘删除后造成的bug
  - 更新标签时
  - 更新全部文件夹时
- 添加 **筛选后导出** 功能
- 添加 **筛选后删除** 功能
- 修复element-ui的message组件重复出现bug
- 待更新：
  - 在文件夹下添加批量导入功能
  - 考虑自更新而非手动更新



### 更新v0.1.1

- 修复执行操作时json文件被删除出现的异常
- 调整主题配色
- 增加拖放按钮，使窗口可拖放
- 增加提示
- 待更新：
  - 图标查看列表
  - 是否加入文件分类排序
  - 加入 *创建文件夹* 功能，以及 *文件批量导出导入* 功能





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

