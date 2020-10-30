process.on('uncaughtException', function(err) {
	console.log(err);
});

var fs = require('fs');
var net = require('net');
var tls = require('tls');

var conf = {};

var readconf = function(config) {
	conf = JSON.parse(fs.readFileSync(config));
};

function serverListener(c, https) {
	readconf("main.conf");
	var queue = [];
	var opened = false;
	var websockets = false;
	var client = undefined;
	var interval = undefined;
	var path = undefined;
	c.on('data', function(data) {
		if (opened) {
			if (client != undefined) {
				client.write(data);
			} else {
				queue.push(data);
			}
		} else {
			if (path == undefined && data.includes("HTTP/1")) {
				path = data.toString().split(" ")[1];
			}
			opened = true;
			var host = data.toString().toLowerCase().slice(data.toString().toLowerCase().indexOf("host: ")+6, data.toString().length).split("\n")[0].trim();
			if (host == undefined || host.trim() == "") {host = "default";}
			if (conf[host] == undefined) {host = "default";}
			if (!https && (conf[host].upgradeInsecure || (conf[host].upgradeInsecure == undefined && conf['default'].upgradeInsecure))) {
				c.end("HTTP/1.1 301 Moved Permanently\r\nContent-Type: text/html\r\nDate: "+new Date().toUTCString()+"\r\nServer: JoshieProx/2_"+process.platform+"\r\nLocation: https://"+host+path+"\r\nVary: Upgrade-Insecure-Requests\r\n\r\nUpgrading to HTTPS...");
			} else {
				if (conf[host].type == "proxy") {
					client = net.connect(conf[host].location.split(":")[2], conf[host].location.split("://")[1].split(":")[0]);
				} else {
					client = net.connect(81, "127.0.0.1");
				}
				client.on('data', function(cdata) {
					try {
						c.write(cdata);
					} catch(err) {try{c.end();}catch(err){}}
				});
				client.on('end', function() {
					try {
						c.end();
						clearInterval(interval);
					} catch(err) {}
				});
				client.write(data);
				interval = setInterval(function() {
					for (var i in queue) {
						try {
							client.write(queue[0]);
							queue.splice(0,1);
						} catch(err) {}
					}
				}, 100);
			}
		}
	});
	c.on('end', function() {
		if (opened) {
			opened = false;
		}
		if (client != undefined) {
			client.end();
			client = undefined;
		}
		try {
			clearInterval(interval);
		} catch(err) {}
	});
}

var server = net.createServer(function(c) {
	serverListener(c, false);
});

function snicallback(servername, cb) {
	var server = "default";
	var key = "";
	var cert = "";
	if (conf[servername] != undefined) {
		if (conf[servername].ssl != undefined) {
			if (conf[servername].ssl.key != undefined && conf[servername].ssl.cert != undefined) {
				server = servername;
			}
		}
	}
	if (conf[server].ssl != undefined) {
		if (conf[server].ssl.key != undefined && conf[server].ssl.cert != undefined) {
			key = conf[server].ssl.key;
			cert = conf[server].ssl.cert;
		} else {
			key = "ssl/key.pem";
			cert = "ssl/cert.pem";
		}
	} else {
		key = "ssl/key.pem";
		cert = "ssl/cert.pem";
	}
	cb(null, tls.createSecureContext({cert:fs.readFileSync(cert),key:fs.readFileSync(key)}));
}

var options = {
	SNICallback: snicallback
}

var sserver = tls.createServer(options, function(c) {
	serverListener(c, true);
});

readconf("main.conf");
server.listen(80);
sserver.listen(443);
console.log("JoshieProx 2 started...");
