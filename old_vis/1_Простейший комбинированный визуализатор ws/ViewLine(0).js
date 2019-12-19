//-----------------------------------------------------------------------------
// 
//-----------------------------------------------------------------------------
"use strict"
//-----------------------------------------------------------------------------
ViewLine.prototype.Set = function(num,width,height,y_ln)
{
  // console.log(num,width,height,y_ln)
  this.Num    = num;
  this.Width  = width;                       // длина сигнала (px) // пары x,y

  this.yLevel = y_ln;                       // уровень развертки сигнала (px)
  this.Clr = new Float32Array([0,0,1.0,1.0]);   // цвет
  this.Buf = new Float32Array(width*2);     // визуализируемые поточечно данные (x,y)

  var p = 0;
  for(var i=0; i<this.Width; i++)
  {
    this.Buf[p++] =  i;
    this.Buf[p++] =  0;
  };
}

ViewLine.prototype.AddPointS = function(y)
{
  // console.log(y)

  for(var i=0; i<y.length; i++)
  {
    this.Buf[this.Pnt*2 + 1] =  y[i];       
    this.Pnt++; this.Pnt %= this.Width;
  };

  this.xLevel = this.Pnt;
}

function ViewLine( name ) // конструктор класса 
{
  this.Name     = name;   // подпись канала
  this.Num      = 0;      // номер на окне, для отладки
  this.Pnt      = 0;      // указатель в буфере // указатель развертки
  this.xLevel   = 0;
 
  this.Width    = 0;      // длина сигнала (px)
  this.yLevel   = null;   // уровень развертки сигнала (px)
  this.Clr      = null;   // цвет
  this.Buf      = null;   // визуализируемые поточечно данные (x,y)
 
  this.DrawAlg  = "line"; // алгоритм развертки
}
//-----------------------------------------------------------------------------
function MakeLines_0(lines,width,height) // разместить линии в графическом окне
{
  // считаем количество эффективных линий
  var cl = 0;
  for(var i=0; i<lines.length; i++)
  {
    // cчитаем линии
    if (lines[i].DrawAlg  == "line") { cl++; } 
      else  { lines[i].Set(i,width,height,0); }
  };

  // размещаем линии
  var dlLn = Math.round( height / (cl+1) );
  var yLn = dlLn;
  for(var i=0; i<lines.length; i++)
  {
    if (lines[i].DrawAlg  == "line") 
    {
      lines[i].Set(i,width,height,yLn);
      yLn += dlLn;
    };
  }
}
//-----------------------------------------------------------------------------
function ViewGrid(name) // конструктор класса 
{
  this.Name     = name;   // подпись канала
  this.Num      = 0;      // номер на окне, для отладки
  this.Pnt      = 0;      // указатель в буфере // указатель развертки
  this.xLevel   = 0;

  this.Width    = 0;      // длина сигнала (px)
  this.yLevel   = null;   // уровень развертки сигнала (px)
  this.Clr      = null;   // цвет
  this.Buf      = null;   // визуализируемые поточечно данные (x,y)

  this.DrawAlg  = "grid"; // алгоритм развертки
}

ViewGrid.prototype.Set = function(num,width,height,y_ln)
{
  this.yLevel = 0;                                // уровень развертки сигнала (px)
  this.Clr = new Float32Array([0.1,0.1,0.1,0.2]);   // цвет

  var st = 50;

  var cxln = Math.floor( width / st );
  var cyln = Math.floor( height / st );

  this.Buf = new Float32Array( (cxln + cyln) * 4);  // визуализируемые поточечно данные (x,y) начало - конец

  var p = 0;

  for(var i=0; i<cxln; i++)
  {
    this.Buf[p++] = i*st;               //x
    this.Buf[p++] = 0;                  //y  
    this.Buf[p++] = i*st;               //x
    this.Buf[p++] = height;             //y   
  };

  for(var i=0; i<cyln; i++)
  {
    this.Buf[p++] = 0;                  //x
    this.Buf[p++] = i*st + st/2;        //y  
    this.Buf[p++] = width;              //x
    this.Buf[p++] = i*st + st/2;        //y   
  };

  // будут сбои при width некратном st - надо отработать увеличением поля
  this.Width  = width; 
}

ViewGrid.prototype.AddPointS = function(y)
{
  for(var i=0; i<y.length; i++)
  {
    this.Pnt++; this.Pnt %= this.Width;
  };

  this.xLevel = this.Pnt;
}
//-----------------------------------------------------------------------------
//-----------------------------------------------------------------------------
//-----------------------------------------------------------------------------
// поробуем сделать метки событий
// тут нет типизаций, поэтому можем 
//-----------------------------------------------------------------------------
class ViewMark
{
  constructor(name) // конструктор класса 
  {
    this.Name     = name;   // подпись канала
    this.Num      = 0;      // номер на окне, для отладки
    this.Pnt      = 0;      // указатель в буфере // указатель развертки
    this.xLevel   = 0;

    this.Width    = 0;      // длина сигнала (px)
    this.yLevel   = null;   // уровень развертки сигнала (px)
    this.Clr      = null;   // цвет
    this.Buf      = null;   // визуализируемые поточечно данные (x,y)
 
    this.DrawAlg  = "mark"; // алгоритм развертки

    this.TotalObjs = 1;
    this.Buf = new Float32Array(6 * this.TotalObjs);
    this.MakeTriangle(990,500,5); 
    }


  Set(num,width,height,y_ln)
  {
    this.Width  = width; 
    this.yLevel = 0;                                  // уровень развертки сигнала (px)
    this.Clr = new Float32Array([1.0,0.0,0.0,1.0]);   // цвет
  }
}

ViewMark.prototype.MakeTriangle = function(x,y,d)
{
  var m = [x,y+d, x+d,y-d, x-d,y-d]; 
  for(var i=0; i<m.length; i++) this.Buf[i] = m[i];
}

ViewMark.prototype.AddPointS = function(y)
{
  for(var i=0; i<y.length; i++)
  {
    this.Pnt++; this.Pnt %= this.Width;
  };

  this.xLevel = this.Pnt;
}
//-----------------------------------------------------------------------------
class ViewSign
{
  constructor(name) // конструктор класса 
  {
    this.Name     = name;   // подпись канала
    this.Num      = 0;      // номер на окне, для отладки
    this.Pnt      = 0;      // указатель в буфере // указатель развертки
    this.xLevel   = 0;

    this.Width    = 0;      // длина сигнала (px)
    this.yLevel   = null;   // уровень развертки сигнала (px)
    this.Clr      = null;   // цвет
    this.Buf      = null;   // визуализируемые поточечно данные (x,y)
 
    this.DrawAlg  = "mark"; // алгоритм развертки
    }


  Set(num,width,height,y_ln)
  {
    this.Width  = width; 
    this.yLevel = 0;                                  // уровень развертки сигнала (px)
    this.Clr = new Float32Array([0.0,1.0,0.0,1.0]);   // цвет

    this.Buf = new Float32Array(6);//new Float32Array([100,100, 200,200, 300,50]);  
    this.MakeTriangle(990,200,5); 
  }
}

ViewSign.prototype.MakeTriangle = function(x,y,d)
{
  var m = [x,y+d, x+d,y-d, x-d,y-d]; 
  for(var i=0; i<m.length; i++) this.Buf[i] = m[i];
}

ViewSign.prototype.AddPointS = function(y)
{
  for(var i=0; i<y.length; i++)
  {
    this.Pnt++; this.Pnt %= this.Width;
  };

  this.xLevel = this.Pnt;
}
//-----------------------------------------------------------------------------