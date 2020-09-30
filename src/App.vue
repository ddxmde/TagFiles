<template>
  <div id="app">
    <el-container v-loading.fullscreen.lock="fullscreenLoading">
        <el-aside width="65px">
            <el-menu :default-active="cur_path_index"  text-color="#FFFFFF" 
                background-color="#545c64" 
                @open="handleOpen" @close="handleClose" :collapse="isCollapse"
                @select="handleSelect">
                <el-menu-item index="1" route="/Main">
                    <i class="el-icon-files"></i>
                    <span slot="title">文档</span>
                </el-menu-item>
                <el-menu-item index="2">
                    <i class="el-icon-setting"></i>
                    <span slot="title">设置</span>
                </el-menu-item>
                <el-menu-item index="3">
                    <i class="el-icon-full-screen"></i>
                    <span slot="title">{{is_full_screen?'小窗':'全屏'}}</span>
                </el-menu-item>
                <el-menu-item index="4">
                    <i class="el-icon-switch-button"></i>
                    <span slot="title">退出</span>
                </el-menu-item>
            </el-menu>
        </el-aside>
        <el-container>
          <el-header >
            <el-row justify="center">
              <el-select v-model="search_folder" 
                  value-key="path" multiple placeholder="指定文件夹">
                  <el-option
                  v-for="item in sys_folders"
                  :value="item" :key = "item.path"
                  :label="item.path">
                  <span style="float: left;margin-right:5px;">{{ item.name }}</span>
                  <span style="float: right; margin-left:5px;color: #cccccc; font-size: 13px">{{ item.path }}</span>
                  </el-option>
              </el-select>
              <el-input @focus="gomain()"
                  placeholder="输入查询的标签,多个标签用 / 隔开"
                  v-model="inputTags"
                  clearable>
              </el-input>
              <el-button icon="el-icon-search" @click="search()"></el-button>
            </el-row>
          </el-header>
          <el-main>
              <router-view></router-view>
          </el-main>
        </el-container>
    </el-container>
  </div>
</template>

<script>
//window.electron = require('electron');
//const ipcRenderer = window.electron.ipcRenderer;
const {
  ipcRenderer
} = window.require('electron');
export default {
  name: 'app',
  components: {
  },
  data() {
      return {
        isCollapse: true,cur_path_index:"1",
        is_full_screen:false,
        sys_folders:[],
        search_folder:[],
        inputTags:'',
        fullscreenLoading:false
      };
  },
  mounted() {
    this.$router.push({ name:'Main'})
    this.cur_path_index = "1"
    this.getSysFolders()
  },
  methods: {
      handleOpen(key, keyPath) {
        console.log(key, keyPath);
      },
      handleClose(key, keyPath) {
        console.log(key, keyPath);
      },
      handleSelect(index,indexpath){
        if(index==4){
            ipcRenderer.send('window-close');
        }
        if(index==3){
          this.is_full_screen = !this.is_full_screen
          ipcRenderer.send('toggal-fullscreen',this.is_full_screen);
          //this.$router.push({ name:'Folder',params:{targetFolder:target }})
        }
        if(index==2){
            //this.$router.push({ name:'Setting'})
        }
        if(index==1){
            this.$router.push({ name:'Main'})
        }
      },
      getSysFolders(){
          var _that = this
          ipcRenderer.send('get-folders');
          ipcRenderer.on("send-folders",(event,args)=>{
                _that.sys_folders = args
          })
      },
      search(){
        var _that = this
        //console.log(_that.inputTags)
        if(_that.inputTags==null||_that.inputTags == ""){
            _that.openMessage("请输入标签进行查询",'error')
            return false
        }
        var tmp_tags = _that.inputTags.split("/")
        
        tmp_tags = tmp_tags.map(itm=>{
            return itm.replace(/(^\s*)|(\s*$)/g, "")
        })
        console.log(tmp_tags)
        _that.fullscreenLoading = true
        ipcRenderer.send('search-tags',[_that.search_folder,tmp_tags]);
        ipcRenderer.on("search-tags-response",(event,args)=>{
            _that.fullscreenLoading = false
            _that.inputTags = null
             _that.search_folder=[]
            if(args.length==0){
                _that.openMessage("没有找到对应标签的文件",'error')
            }else{
                _that.openMessage("找到"+args.length+"个结果",'success')
                this.$router.push({ name:'Folder',params:{targetFolder:'',searchResult:args}})
            }
        })
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
      gomain(){
        this.$router.push({name:"Main"})
      }
    }
}
</script>

<style lang="css" scoped>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  
  color: #2c3e50;
  padding:0px;
  width:100%;
  height:100vh ;
}
.el-aside {
    background-color: #545c64;
    color: #FFF;

}
.el-menu{
    height:100%;
    left:0;right:0;border:none;
}
.el-menu i{
         font-size:25px;
         color:#ffffff;
}
.el-main{
      background:#f4f4f4;
}
.el-container{
      height:100%;
}
.el-header{
  padding-top:10px;
  background:#e3e3e3;
  box-shadow:0px 3px 5px #333333;
  text-align: center;
}
.el-input{
      width:290px;
      height:40px;
      margin-left:5px;
  }
  .el-select{
      min-width:120px;
      height:40px;
      margin-left:5px;
  }
  .el-button{
      height:40px;
      z-index:99999;
      margin-left:5px;
  }
</style>
