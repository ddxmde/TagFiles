<!--
Description
@authors Your Name (you@example.org)
@date    2020-09-29 19:01:11
@version 1.0.0
-->
<template>
  <div>
    <el-table stripe :show-header="false" :row-style="setRowStyle"
      :data="folders"
      style="width: 100%">
        <el-table-column type="expand">
            <template slot-scope="scope">
                <div label-position="left"  class="table-expand">
                    <el-tag closable size="medium" type="danger" style="float:left;margin-left:10px;margin-top:10px;"
                        v-for="(tag,taginx) in scope.row.tags" :key="tag"  @close="removeTag(scope.$index,tag)">
                        {{tag}}
                    </el-tag>
                    <div style="width:100%;margin-top:10px;clear:both;">
                        <el-input :key="scope.$index" size="small" placeholder="输入标签用 / 隔开" v-model="newTags" class="input-with-button">
                            <el-button :key="'btn'+scope.$index" slot="append" type="info" @click="addTags(scope.$index)">添加</el-button>
                        </el-input>
                    </div>
                </div>
            </template>
        </el-table-column>
        <el-table-column width="360">
            <template slot-scope="scope">
            <div class="folderName">
                <i class="el-icon-picture-outline" v-if="scope.row.labelType=='image'"></i>
                <i class="el-icon-document" v-else-if="scope.row.labelType=='doc'"></i>
                <i class="el-icon-box" v-else-if="scope.row.labelType=='rar'"></i>
                <i class="el-icon-film" v-else-if="scope.row.labelType=='video'"></i>
                <span v-else>
                    <i class="el-icon-folder" v-if="scope.row.type=='文件夹'"></i>
                    <i class="el-icon-coin" v-else></i>
                </span>
                <el-tooltip class="item" effect="light" 
                    :content="scope.row.path" placement="bottom">
                <span style="margin-left: 10px">{{ scope.row.fullName }}</span>
                </el-tooltip>
            </div>
            </template>
        </el-table-column>
        <el-table-column
            width="180">
            <template slot-scope="scope">
                <el-popover
                    placement="right-end"
                    width="320"
                    trigger="hover" v-if="scope.row.labelType=='image'">
                    <img :src="getSafePath(scope.row.path)" width="320px" />
                    <div slot="reference">
                        <span style="margin-left:10px" v-if="scope.row.type!='文件夹'">类型：{{ scope.row.type }}</span>
                        <p v-else style="font-weight:bold">
                            <span style="margin-left:10px">文件数：{{ scope.row.info.count }}</span>
                            <span style="margin-left:10px;background:#ff0033;
                                            padding:3px;color:#FFFFFF;border-raidus:3px;"
                                v-if="scope.row.info.totalCount-scope.row.info.count!=0">
                                {{ scope.row.info.totalCount-scope.row.info.count }}
                            </span>
                        </p>
                    </div>
                </el-popover>
                <div v-else>
                        <span style="margin-left:10px" v-if="scope.row.type!='文件夹'">类型：{{ scope.row.type }}</span>
                        <p v-else style="font-weight:bold">
                            <span style="margin-left:10px">文件数：{{ scope.row.info.count }}</span>
                            <span style="margin-left:10px;background:#ff0033;
                                            padding:3px;color:#FFFFFF;border-raidus:3px;"
                                v-if="scope.row.info.totalCount-scope.row.info.count!=0">
                                {{ scope.row.info.totalCount-scope.row.info.count }}
                            </span>
                        </p>
                </div>
                
            </template>
        </el-table-column>
        <el-table-column fixed="right">
            <template slot-scope="scope">
            <el-button
                size="mini" type="primary"
                @click="handleOpen(scope.row)">打开</el-button>
            <el-button
                size="mini" type="warning"
                @click="$emit('goparent',scope.row)">上级目录</el-button>
            </template>
        </el-table-column>
    </el-table>
  </div>
</template>

<script>
const {
    ipcRenderer,shell
  } = window.require('electron');
  export default {
      name:'FileTable',
      data(){
          return{
              newTags:'',
          }
      },
      props:{
          folders:{
              type:Array,
              default:[]
          }
      },
      mounted() {
          //this.getSysFolders()
      },
      methods: {
        getSafePath (path) {
            // return `${__safeFileProtocol}://${path}`
            return `electrondemo-safe-file-protocol://${path}`
        },
        setRowStyle({row,rowIndex}) {
            if(rowIndex%2==0){
            return {'background-color': '#f3f9f1','cursor':'pointer','color':'#2e4e7e'}
            }
            else return {'background-color': '#e0eee8','cursor':'pointer','color':'#2e4e7e'}
        },
        addTags(index){
                var oldtags = this.folders[index].tags
                var newTagArr = this.newTags.split('/')
                newTagArr.map((itm) =>{
                    itm = itm.replace(/(^\s*)|(\s*$)/g, "")
                    var i=0
                    for(;i<oldtags.length;i++){
                        if(oldtags[i].indexOf(itm)>-1){
                            break
                        }
                        if(itm.indexOf(oldtags[i])>-1){
                            oldtags[i] = itm
                            break
                        }
                    }
                    if(i==oldtags.length){oldtags.push(itm)}
                    return itm
                })
                this.folders[index].tags = oldtags
                var _that = this

                //console.log("当前文件路径"+this.$route.params.targetFolder)
                ipcRenderer.send("update-tags",this.folders[index])
                ipcRenderer.once("update-tags-response",(event,args)=>{
                   if(args){
                        _that.openMessage("更新成功")
                   }else{
                        _that.openMessage("更新失败","error")
                   }
                })
                this.newTags = null
        },
        openMessage(message,type='success'){
                console.log(type)
                this.$message({
                message,
                type,
                duration:2000,
                offset:120
                });
        },
        removeTag(index,tag){
            var oldtags = this.folders[index].tags
            oldtags = oldtags.filter(t=>{
                return t!=tag
            })
            this.folders[index].tags = oldtags
            var _that = this
            ipcRenderer.send("update-tags",this.folders[index])
            ipcRenderer.once("update-tags-response",(event,args)=>{
                   if(args){
                        _that.openMessage("更新成功")
                   }else{
                        _that.openMessage("更新失败","error")
                   }
            })
        },
        handleOpen(row){
            if(row.type=="文件夹"){
                this.$emit('openChild',row)
            }else{
                shell.showItemInFolder(row.path)
            }
        }
      },
  }
</script>

<style lang="css" scoped>
  .table-expand{
      width:100%;
      padding:10px;
      margin:0;
  }
  .folderName{
    font-size:16px;
    font-weight:bold;
  }
  .folderName  i{
    font-size:20px;
  }
  .input-with-button{
      width:260px;
      margin-left:10px;
      margin-top:10px;
  }
</style>
