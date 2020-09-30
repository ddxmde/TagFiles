<!--
Description
@authors Your Name (you@example.org)
@date    2020-09-30 17:10:27
@version 1.0.0
-->
<template>
  <div>
    待完成
  </div>
</template>

<script>
  export default {
      name:'FileCard',
      props:{
          FileInfo:{
              type:Array,
              required: true
          }
      }
  }
</script>

<style lang="css" scoped>
  .file-card {
      height:200px;
      border:1px solid #cccccc;
      box-shadow: 0px 0px 5px #444;
  }
  .file-card img{
      height:120px;
      
  }
</style>
