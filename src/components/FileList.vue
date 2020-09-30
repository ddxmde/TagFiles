<!--
Description
@authors Your Name (you@example.org)
@date    2020-09-27 19:48:02
@version 1.0.0
-->
<template>
  <div>
    <el-card v-for="(item,inx) in folders" :key="inx"
        ref="elcard"
        :body-style="{ padding: '0px',width:imgwidth[inx] }" 
        >
      <img :src="getSafePath(item.path)" class="image">
      <el-row >
        <el-col :offset="6" :span="12">
        <el-button type="text" class="button">编辑标签</el-button>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script>
  export default {
      name:'FileList',
      props:{
          folders:{
              type:Array,
              default:[]
          }
      },
      data(){
          return{
              imgwidth:[]
          }
      },
      mounted() {
          var _that = this
          var tar = this.$refs.elcard
            //console.log(tar)
            tar.map((itm)=>{
                var imgele = itm.$el.getElementsByTagName("img")[0];
                _that.imgwidth.push(imgele.getBoundingClientRect().width+'px')
            })
            //console.log(_that.imgwidth+'px')
      },
      methods: {
        getSafePath (path) {
            // return `${__safeFileProtocol}://${path}`
            return `electrondemo-safe-file-protocol://${path}`
        },
        resize_width(inx){
            var tar = this.$refs.elcard
            //console.log(tar)
            tar.map((itm)=>{
                var imgele = tar.getElementsByTagName("img")[0];
                return imgele.getBoundingClientRect().width
            })
            
        }
    }
  }
</script>

<style lang="css" scoped>
  .time {
    font-size: 13px;
    color: #999;
  }
  

  .button {
      margin:auto;
        height:20px;
  }

  .image {
    height:100px;
    display: block;
  }

  
  .el-card{
      height:130px;
      float:left;
      margin: 10px 20px 10px 20px;
  }
</style>
