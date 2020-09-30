<!--
Description
@authors Your Name (you@example.org)
@date    2020-09-27 15:43:23
@version 1.0.0
-->
<template>
  <div>
    <div  style="margin-top:10px;width:100%;clear:both">
        <div class="containerHeader">
            <div style="float:left;margin:0px 20px;">
                <el-radio-group v-model="checkStyle" size="small">
                    <el-radio-button v-for="fstyle in fstyles" :label="fstyle" :key="fstyle">{{fstyle}}</el-radio-button>
                </el-radio-group>
            </div>
            <el-checkbox :indeterminate="isIndeterminate" 
                v-model="checkAll" @change="handleCheckAllChange"
                style="float:left;margin-right:20px">全选</el-checkbox>
            
            <el-checkbox-group v-model="checkedTypes" @change="handleCheckedChange">
                <el-checkbox v-for="item in ftypes" :label="item" :key="item.type">{{item.label}}</el-checkbox>
            </el-checkbox-group>
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
                parent_folder:''
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
    border-bottom:1px solid #d3d3d3;
    margin-bottom:20px;
    line-height:40px;
  }
</style>
