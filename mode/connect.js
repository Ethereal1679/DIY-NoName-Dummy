"use strict";
game.import("mode", function (lib, game, ui, get, ai, _status) {
	return {
		name: "connect",
		start: function () {
			var directstartmode = lib.config.directstartmode;
			ui.create.menu(true);
			event.textnode = ui.create.div("", "输入联机地址");
			var createNode = function () {
				if (event.created) return;
				if (directstartmode && lib.node) {
					ui.exitroom = ui.create.system(
						"退出房间",
						function () {
							game.saveConfig("directstartmode");
							game.reload();
						},
						true
					);
					game.switchMode(directstartmode);
					return;
				}
				if (lib.node && window.require) {
					ui.startServer = ui.create.system(
						"启动服务器",
						function (e) {
							ui.click.shortcut(false);
							e.stopPropagation();
							ui.click.connectMenu();
						},
						true
					);
				}

				event.created = true;
				var node = ui.create.div(".shadowed");
				node.style.width = "400px";
				node.style.height = "30px";
				node.style.lineHeight = "30px";
				node.style.fontFamily = "xinwei";
				node.style.fontSize = "30px";
				node.style.padding = "10px";
				node.style.left = "calc(50% - 210px)";
				node.style.top = "calc(50% - 20px)";
				node.style.whiteSpace = "nowrap";
				node.textContent = lib.config.last_ip || lib.hallURL;
				node.contentEditable = true;
				node.style.webkitUserSelect = "text";
				node.style.textAlign = "center";
				node.style.overflow = "hidden";

				var connect = function (e) {
					event.textnode.textContent = "正在连接...";
					clearTimeout(event.timeout);
					if (e) e.preventDefault();
					game.saveConfig("last_ip", node.textContent);
					game.connect(node.textContent, function (success) {
						if (success) {
							var info = lib.config.reconnect_info;
							if (info && info[0] == _status.ip) {
								game.onlineID = info[1];
								if (typeof (game.roomId = info[2]) == "string") game.roomIdServer = true;
							}
							return;
						}
						if (event.textnode) {
							alert("连接失败");
							event.textnode.textContent = "输入联机地址";
						}
					});
				};
				node.addEventListener("keydown", function (e) {
					if (e.keyCode == 13) {
						connect(e);
					}
				});
				ui.window.appendChild(node);
				ui.ipnode = node;

				var text = event.textnode;
				text.style.width = "400px";
				text.style.height = "30px";
				text.style.lineHeight = "30px";
				text.style.fontFamily = "xinwei";
				text.style.fontSize = "30px";
				text.style.padding = "10px";
				text.style.left = "calc(50% - 200px)";
				text.style.top = "calc(50% - 80px)";
				text.style.textAlign = "center";
				ui.window.appendChild(text);
				ui.iptext = text;

				var button = ui.create.div(".menubutton.highlight.large.pointerdiv", "连接", connect);
				button.style.width = "70px";
				button.style.left = "calc(50% - 35px)";
				button.style.top = "calc(50% + 60px)";
				ui.window.appendChild(button);
				ui.ipbutton = button;

				var networkInfo = ui.create.div(".shadowed");
				networkInfo.style.width = "min(460px, calc(100% - 32px))";
				networkInfo.style.minHeight = "82px";
				networkInfo.style.boxSizing = "border-box";
				networkInfo.style.padding = "10px 14px";
				networkInfo.style.left = "50%";
				networkInfo.style.top = "calc(50% + 125px)";
				networkInfo.style.transform = "translateX(-50%)";
				networkInfo.style.borderRadius = "6px";
				networkInfo.style.background = "rgba(42, 35, 30, 0.62)";
				networkInfo.style.color = "white";
				networkInfo.style.fontFamily = "sans-serif";
				networkInfo.style.fontSize = "16px";
				networkInfo.style.lineHeight = "23px";
				networkInfo.style.textAlign = "left";
				networkInfo.style.whiteSpace = "normal";
				networkInfo.style.overflowWrap = "anywhere";
				networkInfo.style.webkitUserSelect = "text";
				networkInfo.style.userSelect = "text";

				var networkTitle = document.createElement("div");
				networkTitle.textContent = "联机主机信息";
				networkTitle.style.position = "relative";
				networkTitle.style.display = "block";
				networkTitle.style.fontFamily = "xinwei";
				networkTitle.style.fontSize = "20px";
				networkTitle.style.textAlign = "center";
				networkTitle.style.marginBottom = "3px";
				networkInfo.appendChild(networkTitle);

				var networkDetails = document.createElement("div");
				networkDetails.textContent = "正在检测局域网 IPv4...";
				networkDetails.style.position = "relative";
				networkDetails.style.display = "block";
				networkInfo.appendChild(networkDetails);
				ui.window.appendChild(networkInfo);
				ui.networkInfo = networkInfo;

				fetch("/networkInfo", { cache: "no-store" })
					.then(function (response) {
						if (!response.ok) throw new Error("HTTP " + response.status);
						return response.json();
					})
					.then(function (result) {
						var info = result && result.success && result.data;
						if (!info || !info.preferredAddress) throw new Error("No LAN IPv4 address");
						var addressList = info.addresses.map(function (item) {
							return item.address;
						});
						var remoteAddress = info.zeroTierAddress || info.preferredAddress;
						networkDetails.textContent =
							"局域网 IPv4：" +
							addressList.filter(function (address) {
								return address != info.zeroTierAddress;
							}).join(" / ") +
							(info.zeroTierAddress ? "\nZeroTier IPv4：" + info.zeroTierAddress : "") +
							"\n其他电脑打开：http://" +
							remoteAddress +
							":" +
							info.webPort +
							"\n联机地址：" +
							remoteAddress +
							":" +
							info.multiplayerPort;
						networkDetails.style.whiteSpace = "pre-line";
					})
					.catch(function () {
						networkDetails.textContent = "未检测到局域网 IPv4，请确认已连接 Wi-Fi 或网线。";
					});

				ui.hall_button = ui.create.system(
					"联机大厅",
					function () {
						node.textContent = get.config("hall_ip") || lib.hallURL;
						connect();
					},
					true
				);
				if (!get.config("hall_button")) {
					ui.hall_button.style.display = "none";
				}
				ui.recentIP = ui.create.system("最近连接", null, true);
				var clickLink = function () {
					node.textContent = this.textContent;
					connect();
				};
				lib.setPopped(
					ui.recentIP,
					function () {
						if (!lib.config.recentIP.length) return;
						var uiintro = ui.create.dialog("hidden");
						uiintro.listen(function (e) {
							e.stopPropagation();
						});
						var list = ui.create.div(".caption");
						for (var i = 0; i < lib.config.recentIP.length; i++) {
							ui.create.div(".text.textlink", list, clickLink).textContent = get.trimip(
								lib.config.recentIP[i]
							);
						}
						uiintro.add(list);
						var clear = uiintro.add('<div class="text center">清除</div>');
						clear.style.paddingTop = 0;
						clear.style.paddingBottom = "3px";
						clear.listen(function () {
							lib.config.recentIP.length = 0;
							game.saveConfig("recentIP", []);
							uiintro.delete();
						});
						return uiintro;
					},
					220
				);
				if (get.config("read_clipboard", "connect")) {
					var ced = false;
					var read = (text) => {
						try {
							var text2 = text.split("\n")[2];
							var ip = text2.slice(5);
							if (
								ip.length > 0 &&
								text2.startsWith("联机地址:") &&
								(ced || confirm("是否根据剪贴板的邀请链接以进入联机地址和房间？"))
							) {
								node.innerHTML = ip;
								event.textnode.innerHTML = "正在连接...";
								clearTimeout(event.timeout);
								game.saveConfig("last_ip", node.innerHTML);
								game.connect(node.innerHTML, function (success) {
									if (!success && event.textnode) {
										alert("邀请链接解析失败");
										event.textnode.innerHTML = "输入联机地址";
									}
									if (success) _status.read_clipboard_text = text;
								});
							}
						} catch (e) {
							console.log(e);
						}
					};
					window.focus();
					if (navigator.clipboard && lib.node) {
						navigator.clipboard
							.readText()
							.then(read)
							.catch((_) => {});
					} else {
						var input = ui.create.node("textarea", ui.window, { opacity: "0" });
						input.select();
						var result = document.execCommand("paste");
						input.blur();
						ui.window.removeChild(input);
						if (result || input.value.length > 0) read(input.value);
						else if (confirm("是否输入邀请链接以进入联机地址和房间？")) {
							ced = true;
							var text = prompt("请输入邀请链接");
							if (typeof text == "string" && text.length > 0) read(text);
						}
					}
				}
				lib.init.onfree();
			};
			if (window.isNonameServer) {
				game.connect(window.isNonameServerIp || "localhost");
			} else {
				createNode();
			}
			if (!game.onlineKey) {
				game.onlineKey = localStorage.getItem(lib.configprefix + "key");
				if (!game.onlineKey) {
					game.onlineKey = get.id();
					localStorage.setItem(lib.configprefix + "key", game.onlineKey);
				}
			}
			_status.connectDenied = createNode;
			setTimeout(lib.init.onfree, 1000);
		},
	};
});
