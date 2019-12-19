//-----------------------------------------------------------------------------
//  https://webglfundamentals.org/webgl/lessons/ru/webgl-text-canvas2d.html   // WebGl+Canvas2d
//  https://webglfundamentals.org/webgl/lessons/ru/webgl-text-html.html       // WebGl+HTML
//-----------------------------------------------------------------------------
"use strict"
//-----------------------------------------------------------------------------
function WebGlViewer(id,lines) // конструктор класса 
{
  this.Name   = id;                           // в соответствии с описанием HTML
  this.Canvas = document.getElementById(id);  //
  
  this.Width  = this.Canvas.width; 
  this.Height = this.Canvas.height;

  this.Init();

  this.Lines = lines;
}
//-----------------------------------------------------------------------------
WebGlViewer.prototype.createShader = function(type, source) 
{
  var shader = this.Context.createShader(type);
  this.Context.shaderSource(shader, source);
  this.Context.compileShader(shader);
  var success = this.Context.getShaderParameter(shader, this.Context.COMPILE_STATUS);
  if (success)  {  return shader;  }
  console.log(this.Context.getShaderInfoLog(shader));
  this.Context.deleteShader(shader);
}
//-------------------------------------
WebGlViewer.prototype.createProgram = function(vertexShader, fragmentShader) 
{
  var program = this.Context.createProgram();
  this.Context.attachShader(program, vertexShader);
  this.Context.attachShader(program, fragmentShader);
  this.Context.linkProgram(program);
  var success = this.Context.getProgramParameter(program, this.Context.LINK_STATUS);
  if (success) { return program; }
  console.log(this.Context.getProgramInfoLog(program));
  this.Context.deleteProgram(program);
}
//-------------------------------------
WebGlViewer.prototype.Init = function() 
{
 
  var context = this.Context = this.Canvas.getContext("webgl");
  if (!context) { return;  }

  var vertexShader    = this.createShader(context.VERTEX_SHADER,   getVertexShader()   ); // загружаем вершинный шейдера
  var fragmentShader  = this.createShader(context.FRAGMENT_SHADER, getFragmentShader() ); // загружаем фрагментный шейдер
  var programGLSL     = this.createProgram(vertexShader, fragmentShader);                 // загружаем GLSL программу

  // получаем доступ к глобальным переменным шейдеров для передачи данных 
  this.positionAttributeLocation = context.getAttribLocation(programGLSL,  "a_position");    //
  this.resolutionUniformLocation = context.getUniformLocation(programGLSL, "u_resolution");  // размер области рисования в px
  this.colorUniformLocation      = context.getUniformLocation(programGLSL, "u_color");       //
  this.shiftLocation             = context.getUniformLocation(programGLSL, "u_shift");       //
  this.XmodLocation              = context.getUniformLocation(programGLSL, "u_xmod");       //
 
 // Tell it to use our program (pair of shaders)
 context.useProgram(programGLSL);


 // Turn on the attribute
 context.enableVertexAttribArray(this.positionAttributeLocation);

  // Create a buffer and put three 2d clip space points in it
  var positionBuffer = context.createBuffer(); // создать буфер вершин

  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
  context.bindBuffer(context.ARRAY_BUFFER, positionBuffer); // привязать буфер к точке связи

  // устанавливает размер зоны +-1 в этих координитах // нужно использовать для создания окон
  //context.viewport(50, 25, this.Width-100, this.Height-50); // установка размера окна отображения в px
  context.viewport(0, 0, this.Width-0, this.Height-0); // установка размера окна отображения в px

  // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  var size = 2;               // 2 components per iteration
  var type = context.FLOAT;   // the data is 32bit floats
  var normalize = false;      // don't normalize the data
  var stride = 0;             // 0 = move forward size * sizeof(type) each iteration to get the next position
  var offset = 0;             // start at the beginning of the buffer
  context.vertexAttribPointer(this.positionAttributeLocation, size, type, normalize, stride, offset);  

  context.clearColor(1.0, 1.0, 1.0, 1.0); // цвет фона, используется в context.clear(context.COLOR_BUFFER_BIT);
  context.uniform2f(this.resolutionUniformLocation, this.Width, this.Height); // установка размера окна для пересчета в px
}
//-----------------------------------------------------------------------------
WebGlViewer.prototype.Clear = function ()
{
  this.Context.clear(this.Context.COLOR_BUFFER_BIT); // очищаем область
}
//-------------------------------------
WebGlViewer.prototype.DrawLines = function ()
{
  for(var i=0; i<this.Lines.length; i++)
  {
    switch(this.Lines[i].DrawAlg)  // алгоритм развертки
    {
      case "line": { this.DrawLine(this.Lines[i]); break; }
      case "grid": { this.DrawGrid(this.Lines[i]); break; }
      case "mark": { this.DrawMark(this.Lines[i]); break; }     
      case "sign": { break; }     
      default:     { break; }
    };
  }
}
//-------------------------------------
WebGlViewer.prototype.DrawMark = function (line)
{
  var context = this.Context;

  context.bufferData(context.ARRAY_BUFFER,  line.Buf, context.STATIC_DRAW); // наполнить буфер данными через точку связи
  context.uniform4fv(this.colorUniformLocation, line.Clr);                  // line.Clr  

  context.uniform2f(this.XmodLocation ,0,0);                                // 
  context.uniform2f(this.shiftLocation, 0,0);                    // сдвигаем его 
  context.drawArrays(context.TRIANGLES, 0, line.TotalObjs*3);               // смещение, длина в точках  
}
//-------------------------------------
WebGlViewer.prototype.DrawGrid = function (line)
{
  var context = this.Context;

  context.bufferData(context.ARRAY_BUFFER,  line.Buf, context.STATIC_DRAW); // наполнить буфер данными через точку связи
  context.uniform4fv(this.colorUniformLocation, line.Clr);                  // line.Clr

  context.uniform2f(this.XmodLocation , line.Width,0);                      // 
  context.uniform2f(this.shiftLocation, -line.xLevel,0);                    // сдвигаем его 
  context.drawArrays(context.LINES, 0, 20*2);                               // смещение, длина в точках

  context.uniform2f(this.XmodLocation , 0,0);                               // 
  context.uniform2f(this.shiftLocation, 0,0);                               // сдвигаем его 
  context.drawArrays(context.LINES, 20*2, 16*2);                            // смещение, длина в точках  
  
}
//-------------------------------------
WebGlViewer.prototype.DrawLine = function (line)
{
  var context = this.Context;
  var xs = line.xLevel;

  context.bufferData(context.ARRAY_BUFFER, line.Buf, context.STATIC_DRAW);  // наполнить буфер данными через точку связи
  context.uniform4fv(this.colorUniformLocation, line.Clr);                  // line.Clr
  context.uniform2f(this.XmodLocation , 0.0, 0.0);                          //

  // рисуем первый кусок линии от указателя до конца
  var dx = (line.Width-xs);

  if (dx!=0)
  {
    context.uniform2f(this.shiftLocation, -xs, line.yLevel);                // сдвигаем его 
    context.drawArrays(context.LINE_STRIP, xs, dx);                          // смещение, длина в точках
  }

  // рисуем второй кусок линии от 0 до указателя(xs); его длина xs
  if (xs!=0)
  {
    context.uniform2f(this.shiftLocation, dx, line.yLevel);                 // передвигием его вперед
    context.drawArrays(context.LINE_STRIP,  0, xs );                        // смещение, длина в точках
  };

}
//-----------------------------------------------------------------------------
//-----------------------------------------------------------------------------
//-----------------------------------------------------------------------------





