const dgram = require('dgram')
const request = require('request')
const dnsPacket = require('dns-packet')

const port = 53
const url = "https://172.105.117.93/dns-query"

//pinning to IPv4 as server was replying on IPv6 when request came in on IPv4
const server = dgram.createSocket('udp4')

server.on('listening', function(){
  console.log("listening")
})

server.on('message', function(msg, remote){
  var packet = dnsPacket.decode(msg)
  console.log(packet.questions, remote)
  var id = packet.id
  var options = {
    url: url,
    method: 'POST',
    body: msg,
    encoding: null,
    rejectUnauthorized: false,
    headers: {
      'Accept': 'application/dns-message',
      'Content-Type': 'application/dns-message'
    }
  }

  request(options, function(err, resp, body){
    if (!err && resp.statusCode == 200) {
      var respPacket = dnsPacket.decode(body)
      respPacket.id = id
      // console.log(respPacket);
      server.send(dnsPacket.encode(respPacket), remote.port, remote.address, function (error) {
        if (error) {
            client.close();
        }
    });
    } else {
      console.log(err)
    }
  })
})

server.bind(port)
