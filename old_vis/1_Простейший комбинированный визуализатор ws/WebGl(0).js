
//-----------------------------------------------------------------------------
"use strict"

var canvas_web_gl;
//var canvas_web_gl_H;
var canvas_usual;
var generators;
var lines;
var parsData;
var parsView;
var parsErr;
//-----------------------------------------------------------------------------
window.onresize = function (event) //исполняется многократно при любом изменении размеров
{
  console.log("window.onresize");
}

window.onload = function () // исполняется 1 раз при создании страницы // создаем объекты
{
  document.getElementById("btnTest0").onclick = btnTest_Click;

  parsData = document.getElementById("Data");
  parsView = document.getElementById("View");
  parsErr = document.getElementById("Err");

  var dg = 4;
  generators =
    [
      new MyGeneratorSin(0, 0, 1000, dg),

      new MyGeneratorSin(40, 2, 1000, dg),
      new MyGeneratorSin(40, 3, 1000, dg),
      new MyGeneratorSin(40, 4, 1000, dg),
      new MyGeneratorSin(40, 5, 1000, dg),
      new MyGeneratorSin(40, 6, 1000, dg),
      new MyGeneratorSin(40, 7, 1000, dg),
      new MyGeneratorSin(40, 8, 1000, dg),
      new MyGeneratorSin(40, 9, 1000, dg),
      /*
          new MyGeneratorSin( 40,2,1000,dg ),
          new MyGeneratorSin( 40,3,1000,dg ),
          new MyGeneratorSin( 40,4,1000,dg ),
          new MyGeneratorSin( 40,5,1000,dg ),
          new MyGeneratorSin( 40,6,1000,dg ),
          new MyGeneratorSin( 40,7,1000,dg ),
          new MyGeneratorSin( 40,8,1000,dg ),
          new MyGeneratorSin( 40,9,1000,dg ),     
          
          new MyGeneratorSin( 40,2,1000,dg ),
          new MyGeneratorSin( 40,3,1000,dg ),
          new MyGeneratorSin( 40,4,1000,dg ),
          new MyGeneratorSin( 40,5,1000,dg ),
          new MyGeneratorSin( 40,6,1000,dg ),
          new MyGeneratorSin( 40,7,1000,dg ),
          new MyGeneratorSin( 40,8,1000,dg ),  
          new MyGeneratorSin( 40,9,1000,dg ), 
      */
    ]

  lines =
    [
      new ViewGrid("grid"),

      new ViewLine("lines0"),
      new ViewLine("lines1"),
      new ViewLine("lines2"),
      new ViewLine("lines3"),
      new ViewLine("lines4"),
      new ViewLine("lines5"),
      new ViewLine("lines6"),
      new ViewLine("lines7"),
      new ViewLine("lines8"),
      new ViewLine("lines9"),

      /*
        new ViewLine("lines0"),
        new ViewLine("lines1"),
        new ViewLine("lines2"),
        new ViewLine("lines3"),
        new ViewLine("lines4"),
        new ViewLine("lines5"),
        new ViewLine("lines6"),
        new ViewLine("lines7"),
    
        new ViewLine("lines0"),
        new ViewLine("lines1"),
        new ViewLine("lines2"),
        new ViewLine("lines3"),
        new ViewLine("lines4"),
        new ViewLine("lines5"),
        new ViewLine("lines6"),
        new ViewLine("lines7"),   
      */
    ];

  // canvas_web_gl   = new WebGlViewer ("canvas_web_gl",lines);
  //canvas_web_gl_H = new WebGlViewer ("canvas_web_gl_H",lines);
  canvas_usual = new CanvasViewer("canvas_usual", lines);
  MakeLines_0(lines,  canvas_usual.Width,  canvas_usual.Height); // разместить линии в графическом окне

  // data_inp();
  // var requestId = requestAnimationFrame(draw);

  let socket = new WebSocket("ws://localhost:55678");

  let startTime = Date.now();

  socket.onmessage = (event) => {
    let data = JSON.parse(event.data);
    let endTime = Date.now();

    switch (data.Sign) {
      case "WsServer":
        // document.getElementById("ws-status").innerHTML = data.WsServerStatus
        break;
      case "UsbConnect":
        // document.getElementById("usb-status").innerHTML = data.UsbConnect
        // document.getElementById("usb-name").innerHTML = data.UsbDeviceName
        break;
      case "ViewKdr":
        data.Cannals.push("delta");
        data.delta = endTime - startTime;
        // dataBuffer.putDotsToList(data);
        putData(data)
        break;
      case "UsbDeviceCmd":
        // document.getElementById("usb-command").innerHTML = JSON.stringify(data)
        break;
      default:
        break
    }


    // initVis.draw();
    startTime = endTime;
  };

  socket.onclose = () => {
    console.log("connection close")
  };

  socket.onerror = () => {
    console.log("connection error")
  };

}
//-----------------------------------------------------------------------------
var data_tps = 0;
var data_lasttime = performance.now();

function putData(data) {
  var time = performance.now();
  var dt = time - data_lasttime; data_lasttime = time;
  data_tps += (dt - data_tps) * 0.01;

  data.Cannals.forEach((ch, j) => {
    // if (j === 4){
    //   lines[1].AddPointS([data[ch] / 100000] )
    // }
    if (j === 9) {
      lines[j].AddPointS([data[ch]])
  } else if (j === 8) {
      lines[j].AddPointS([data[ch] % 10000 - 1000])
    } else {
      lines[j].AddPointS([data[ch] / 1000000])
    }
  });

  draw();
}

function data_inp() {
  var time = performance.now();
  var dt = time - data_lasttime; data_lasttime = time;
  data_tps += (dt - data_tps) * 0.01;

  for (var i = 0; i < lines.length; i++) {
    lines[i].AddPointS(generators[i].GetPoint());
  }
  setTimeout(data_inp, 20);
}

//-----------------------------------------------------------------------------
var draw_tps = 0;
var draw_lasttime = performance.now();
var draw_dps = 0;

function draw() {
  var time = performance.now();
  var dt = time - draw_lasttime; draw_lasttime = time;
  draw_tps += (dt - draw_tps) * 0.01;

  // canvas_web_gl.Clear();
  // canvas_web_gl.DrawLines(); 

  canvas_usual.Clear();
  canvas_usual.SignLines();
  canvas_usual.DrawLines();

  //canvas_usual.DrawPars([draw_tps,draw_dps,data_tps]);
  DrawPars([draw_tps, draw_dps, data_tps, NaN, 0, NaN]);

  // requestAnimationFrame(draw);

  // расчитать tps,dps
  dt = performance.now() - time;
  draw_dps += (dt - draw_dps) * 0.01;
}
//-----------------------------------------------------------------------------
function DrawPars(pars) {
  parsView.innerHTML = pars[0].toFixed(1) + '   ' + pars[1].toFixed(1);
  parsData.innerHTML = pars[2].toFixed(1) + '   ' + pars[3].toFixed(1);
  parsErr.innerHTML = pars[4].toFixed(1) + '   ' + pars[5].toFixed(1);
}
//-----------------------------------------------------------------------------
function btnTest_Click() {
}
//-----------------------------------------------------------------------------
//-----------------------------------------------------------------------------
//-----------------------------------------------------------------------------

