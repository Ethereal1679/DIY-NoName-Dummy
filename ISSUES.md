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

  # kill

  当前只有 8080 在运行，对应进程 PID 是 7264；8082 没有启动。

  在 CMD 或 PowerShell 执行：

  taskkill /PID 7264 /T /F

  然后确认端口已释放：

  netstat -ano | findstr ":8080 :8082"

  没有输出就表示服务已全部关闭。接着重新运行：

  H:\My_Game\NoName-for-dummies-main\一键启动联机.bat

  脚本会打开两个独立窗口：

  - NoName Web 8080
  - NoName WebSocket 8082

  联机期间必须保持它们运行。结束游戏时，把这两个窗口关闭，服务才会真正停止。不要使用 taskkill /IM node.exe，那会结束电脑上其他 Node 程序。

  Worked for 2m 27s · done 10:58 PM

  # web skill

  chrome://inspect/#remote-debugging

  启动chrome调试