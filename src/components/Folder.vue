<!--
Description
@authors Your Name (you@example.org)
@date    2020-09-27 15:43:23
@version 1.0.0
-->
<template>
  <div>
    <div  style="margin-top:10px;width:100%;clear:both">
        <div class="containerHeader" >
            <div style="float:left;margin:0px 20px;">
                <el-radio-group v-model="checkStyle" size="small">
                    <el-radio-button v-for="fstyle in fstyles" :label="fstyle" :key="fstyle">{{fstyle}}</el-radio-button>
                </el-radio-group>
            </div>
            <div style="float:left;margin-left:20px">
                <el-checkbox :indeterminate="isIndeterminate" style="float:left;"
                    v-model="checkAll" @change="handleCheckAllChange"
                    >全选</el-checkbox>
                <div style="float:left;margin-left:20px">
                    <el-checkbox-group v-model="checkedTypes" @change="handleCheckedChange">
                        <el-checkbox v-for="item in ftypes" :label="item" :key="item.type">{{item.label}}</el-checkbox>
                    </el-checkbox-group>
                </div>
            </div>
            <div style="float:right;margin-right:20px">
                <el-dropdown trigger="click">
                    <span class="el-dropdown-link">
                        <i class="el-icon-s-grid "></i>
                    </span>
                    <el-dropdown-menu slot="dropdown">
                        <el-dropdown-item style="margin-bottom:5px;">
                            <el-button type="primary" @click="copyInFiles_before()"  v-if="targetFolder!=''"
                                size="small" icon="el-icon-download">导入文件</el-button>
                        </el-dropdown-item>
                        <el-dropdown-item style="margin-bottom:5px;">
                            <el-button type="primary" @click="patchSave_before()" 
                                size="small" icon="el-icon-upload2">全部导出</el-button>
                        </el-dropdown-item>
                        <el-dropdown-item>
                            <el-button type="danger" @click="patchDelete_before()" 
                                size="small" icon="el-icon-warning">全部删除</el-button>
                        </el-dropdown-item>
                    </el-dropdown-menu>
                </el-dropdown>
            </div>
        </div>
       
        <FileList :folders="folders" v-if="checkStyle=='图标'"></FileList>
        <FileTable v-on:goparent="goParent($event)" @openChild="openChild($event)" :folders="folders" v-if="checkStyle=='列表'"></FileTable>
    </div> 
    
  </div>
</template>

<script>
    const {ipcRenderer} = window.require('electron');
    import FileList from './FileList.vue'
    import FileTable from './FileTable.vue'
    const typeOptions = [
        {
            type:"image",
            label:"图片",
            subTypes:['.jpg','.JPG','.JPEG','.png','.PNG','.gif','.GIF']
        },
        {
            type:"doc",
            label:"文档",
            subTypes:['.TXT','.txt','.docx','.doc','.pptx','.ppt','.xlsx','.xls','.md']
        },
        {
            type:"rar",
            label:"压缩包",
            subTypes:['.zip','.rar']
        },
        {
            type:"video",
            label:"视频",
            subTypes:['.mp4','.avi','.mkv','.mpeg']
        },
        {
            type:"other",
            label:"其他",
            subTypes:[]
        }
    ]
    const typeRules = {

    }
    export default {
        name:'Folder',
        components: {
            FileList,FileTable
        },
        props:{
            targetFolder:{
                type:String,
                default:''
            }
        },
        data(){
            return{
                origin_folders:[],
                folders:[],
                search_folder:'',
                checkAll: true,
                checkedTypes:[],
                ftypes: typeOptions,
                isIndeterminate: true,
                checkStyle:'列表',
                fstyles:['列表','图标'],
                sys_folders:[],
                parent_folder:'',
                isConfirmed:false
            }
        },
        computed: {
            searchResult:function(){
                return this.$route.params.searchResult
            }
        },
        methods: {
            getFiles(target){
                var _that = this
                ipcRenderer.send("get-files",target)
                ipcRenderer.once("send-files",(event,args)=>{
                    _that.folders = args.filter(itm=>{return true})
                    _that.origin_folders = args.filter(itm=>{return true})
                    _that.folders = _that.folders.map(itm=>{
                        itm.labelType = _that.getTypeLabelByFileType(itm.type)
                        return itm
                    })
                })
                this.checkAll=true
                this.handleCheckAllChange(this.getallTypeOptions())
            },
            setFiles(){
                this.folders = this.searchResult.filter(itm=>{return true})
                this.origin_folders = this.searchResult.filter(itm=>{return true})
                this.folders = this.folders.map(itm=>{
                        itm.labelType = this.getTypeLabelByFileType(itm.type)
                        return itm
                })
                this.checkAll=true
                this.handleCheckAllChange(this.getallTypeOptions())
            },
            openChild($event){
                if($event.type=="文件夹"&&$event.info.count!=0){
                    this.getFiles($event.path)
                    this.parent_folder = this.targetFolder
                    this.targetFolder = $event.path
                    
                }
            },
            handleCheckAllChange(val) {
                this.checkedTypes = val ? this.getallTypeOptions(): [];
                if(this.checkedTypes.length==0){
                    this.folders = []
                }else{
                    this.folders = this.origin_folders.filter(itm=>{return true})
                }
                this.isIndeterminate = false;
            },
            handleCheckedChange(value) {
                // 选定展示的类型
                var chosen_types = []
                var _that = this
                for(var tmpTy of _that.checkedTypes){
                    if(tmpTy.type!="other")
                        chosen_types = chosen_types.concat(tmpTy.subTypes)
                }
                _that.folders = _that.origin_folders.filter(itm=>{
                    return chosen_types.includes(itm.type)
                })
                var all_file_types = []
                var tmpallOpts = this.getallTypeOptions()
                tmpallOpts.filter(itm=>{
                    all_file_types = all_file_types.concat(itm.subTypes)
                    return true
                })
                //console.log(all_file_types)
                for(var tmpTy of _that.checkedTypes){
                    if(tmpTy.type=="other")
                        //console.log("存在other")
                        _that.folders = _that.folders.concat(_that.origin_folders.filter(itm=>{
                            //console.log(itm.type)
                            if(!all_file_types.includes(itm.type)){
                                //console.log(itm)
                                return true
                            }
                        }))
                }

            },
            goParent($event){
                //console.log(this.targetFolder)
                    var cur_path_list = $event.path.split("\\")
                    cur_path_list.pop()
                    cur_path_list.pop()
                    var cur_path = cur_path_list.join("\\")
                    //console.log(cur_path)
                    var i=0
                    for(;i<this.sys_folders.length;i++){
                        if(cur_path == this.sys_folders[i].path){
                             this.getFiles(cur_path)
                             break
                        }
                        if(cur_path.indexOf(this.sys_folders[i].path)>-1){
                            this.getFiles(cur_path)
                            break
                        }
                        if(this.sys_folders[i].path.indexOf(cur_path)>-1){
                            this.$router.push({name:"Main"})
                            break
                        }
                    }
                    if(i==this.sys_folders.length){
                        this.getFiles(cur_path)
                    }
            },
            getSysFolders(){
                var _that = this
                ipcRenderer.send('get-folders');
                ipcRenderer.on("send-folders",(event,args)=>{
                            _that.sys_folders = args
                })
            },
            getallTypeOptions(){
                return typeOptions.filter(itm=>{return true})
            },
            getTypeLabelByFileType(ftype){
                var tmpallOpts = this.getallTypeOptions()
                var result = ""
                tmpallOpts.filter(itm=>{
                    if(itm.subTypes.includes(ftype)){
                        result = itm.type
                    }
                })
                if(result=="") result="other"
                return result

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
            openConfirm(action,message,icontype="warning",title="提示",btncancel="取消",btnconfirm="确认") {
                var _that = this
                this.$confirm(message, title, {
                confirmButtonText: btnconfirm,
                cancelButtonText: btncancel,
                type: icontype
                }).then(() => {
                    action()
                }).catch(() => {
                             
                });
            },
            patchSave_before(){
                var _that = this
                _that.openConfirm(_that.patchSave,"导出当前全部文件(含文件夹),是否继续？")
            },
            patchSave(){
                //批量导出
                var _that = this
                ipcRenderer.send("patch-save",_that.folders)
                ipcRenderer.once("patch-save-response",(event,args)=>{
                    if(args){
                        _that.openMessage("保存文件成功")
                    }else{
                         _that.openMessage("保存文件失败","error")
                    }
                })
            },
            patchDelete_before(){
                var _that = this
                _that.openConfirm(_that.patchDelete,"本次操作将删除全部文件,是否继续？","error","高风险操作")
            },
            patchDelete(){
                var _that = this
                ipcRenderer.send("patch-delete",_that.folders)
                ipcRenderer.once("patch-delete-response",(event,args)=>{
                    if(args){
                        _that.openMessage("删除文件成功")
                        setTimeout(()=>{
                            _that.$router.push({name:"Main"})
                        },2000)
                    }else{
                         _that.openMessage("删除文件失败","error")
                    }
                })
            },
            copyInFiles_before(){
                //导入文件
                var _that = this
                ipcRenderer.send("choose-copy-files",_that.folders)
                ipcRenderer.once("choose-copy-files-response",(event,args)=>{
                    
                })
            }
        },
        mounted(){
            this.targetFolder = this.$route.params.targetFolder
            //console.log(this.targetFolder)
            if(this.targetFolder!='')
                this.getFiles(this.targetFolder)
            //this.searchResult = this.$route.params.searchResult
            //console.log(this.searchResult)
            if(this.searchResult.length!=0){
                this.setFiles()
            }
            if(this.targetFolder==''&&this.searchResult.length==0){
                this.$router.push({name:"Main"})
            }
            this.getSysFolders()
            this.checkedTypes = this.getallTypeOptions()
            //console.log(this.checkedTypes)

        }
    }
</script>

<style lang="css" scoped>
  .el-row{
      padding-bottom:10px;
  }
  .containerHeader{
    padding:10px 0px;
    border:1px solid #d3d3d3;
    margin-bottom:20px;
    line-height:40px;
    height:40px;
  }
  .el-dropdown {
    vertical-align: top;
  }
  .el-dropdown + .el-dropdown {
    margin-left: 15px;
  }
  .el-dropdown-link{
      font-size:24px;
  }
</style>
