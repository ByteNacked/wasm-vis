//-----------------------------------------------------------------------------
// 
//-----------------------------------------------------------------------------
"use strict"
//-----------------------------------------------------------------------------
function CanvasViewer(id,lines) // конструктор класса 
{
  this.Name   = id;                           // в соответствии с описанием HTML
  this.Canvas = document.getElementById(id);  //
  
  this.Width  = this.Canvas.width; 
  this.Height = this.Canvas.height;

  // создаём контекст 2D
  this.Context = this.Canvas.getContext("2d");
  if (!this.Context) { return; }

  this.Lines = lines;
}
//-----------------------------------------------------------------------------
CanvasViewer.prototype.Clear = function ()
{
  var context = this.Context;
  context.clearRect(0, 0, this.Width, this.Height);
}
//-------------------------------------
CanvasViewer.prototype.DrawLines = function ()
{
  for(var i=0; i<this.Lines.length; i++)
  {
    switch(this.Lines[i].DrawAlg)  // алгоритм развертки
    {
      case "line": { this.DrawLine(this.Lines[i]); break; }
      case "grid": { break; }
      case "mark": { break; }
      case "sign": { this.DrawSign(this.Lines[i]); break; }    
      default:     { break; }
    };
  }
}
//-------------------------------------
CanvasViewer.prototype.DrawSign = function ()
{

}
//-------------------------------------
CanvasViewer.prototype.SignLines = function ()
{
  for(var i=0; i<this.Lines.length; i++)
  {
    this.SignLine(this.Lines[i]);
  }
}
//-------------------------------------
CanvasViewer.prototype.DrawLine = function (line)
{
  var context = this.Context;
  context.beginPath();
  context.lineWidth = 1;
  var p = line.xLevel * 2;
  var y = line.Buf[p+1] + line.yLevel;
  context.moveTo(0,y +4);
  for(var x=2; x<line.Buf.length; x++)
  {
    y = line.Buf[p+1] + line.yLevel;
    context.lineTo(x, y +4);
    p+=2; p %= line.Buf.length;
  };
  context.stroke();
}
//-------------------------------------
CanvasViewer.prototype.SignLine = function (line)
{
  if (line.DrawAlg  == "line")
  {
    var context = this.Context;
    /*
    context.beginPath();
    context.moveTo(0, line.yLevel); context.lineTo(this.Width, line.yLevel);
    context.stroke();
    */
    context.fillText(line.Num + "  " + line.Name + "  " + line.Buf[line.xLevel * 2 + 1].toFixed(1), 10, line.yLevel - 5);  
  };
}
//-----------------------------------------------------------------------------
CanvasViewer.prototype.DrawPars = function (pars)
{
  var context = this.Context;
  // написать интервалы регенерации и трудозатраты
  context.fillText(pars[0].toFixed(1) + '   ' + pars[1].toFixed(1), this.Width-100, 15);  
  // написать интервал прихода точек 
  context.fillText(pars[2].toFixed(1), this.Width-100, 30); 
}
//-----------------------------------------------------------------------------
//-----------------------------------------------------------------------------

