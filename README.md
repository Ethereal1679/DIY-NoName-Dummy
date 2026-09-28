# 1. 棘版sgs

当前代码是一个纯前端静态 Web 游戏项目，不是 Vite/npm 工程：根目录没有 package.json，入口是 index.html，因此无需编译。

  在 PowerShell 中运行：
```
  cd H:\My_Game\NoName-for-dummies-main
  py -m http.server 8080
```
  然后用 Chrome/Edge 打开：
```
  http://127.0.0.1:8080/
```
  如果没有 py 命令，可改用：
```
  python -m http.server 8080
```
  运行逻辑大致是：
```
  index.html
    → noname.js 启动游戏
    → 加载 game、character、card、mode、extension 等资源
    → service-worker.js 提供缓存/离线支持
```

# 2. 使用
运行
```
python -m http.server 8080
```

打开网址
```
http://127.0.0.1:8080/
```

# 3. 联机
  启动网页：

  cd H:\My_Game\NoName-for-dummies-main
  py -m http.server 8080

  启动联机服务器：

  cd H:\My_Game\NoName-for-dummies-main\server
  pnpm run build
  node dist/cli.js --port 8082

  打开 http://127.0.0.1:8080，选择“联机”。局域网其他玩家访问房主的 http://局域网IP:8080，并确保 Windows 防火墙放行 TCP 8080 和 8082。