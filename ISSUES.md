# git 下拉文件出现各种问题
不是 git pull 出错，而是 GitHub 上的提交本身存在“新版武将包 + 旧版核心/扩展”的版本错配。

  具体有两处：

  1. extension/十周年UI/extension.js:11835 仍访问旧版的 jsrgbiaozhao.subSkill.A/B，但新版技能在 character/jsrg/skill.js:8584 中已经只有 global/syujin，所以加载扩
     展时必然报 marktext 错误。

  2. 新版于毒技能在 character/offline/skill/offline_hanmo.js:436 调用了 get.is.damageCard()，但当前旧核心 noname/get/is.js:8 根本没有这个方法，所以触发该技能后必
     然报错。

  你本机没有明显报错，主要是因为扩展开关、“无视扩展报错”等设置保存在每台电脑浏览器自己的 localStorage/IndexedDB 中，不会随 Git 同步；而 damageCard 错误只有触发对
  应技能时才出现。干净电脑会更容易完整暴露这些问题。

  另外，当前 origin/master 确实是 c5f2a82，但本机还有两个未提交修改：

  - mode/connect.js
  - 一键启动联机.bat

  因此它们也尚未出现在其他电脑上。

  正确处理不是清缓存或重装，而是补齐 get.is.damageCard() 兼容 API，并删除或保护十周年 UI 对旧版 A/B 子技能的访问；之后把包括刚才联机界面和启动脚本在内的修改一起
  提交、推送。当前这一轮我只做了诊断，没有改动文件。