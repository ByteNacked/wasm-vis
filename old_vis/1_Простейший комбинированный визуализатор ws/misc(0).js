//-----------------------------------------------------------------------------
"use strict"
//-----------------------------------------------------------------------------

// возврат случайного целого числа значением от 0 до range-1
function randomInt(range) 
{
  return Math.floor(Math.random() * range);
}
//-----------------------------------------------------------------------------
function BufferFilling( buf, z ) // функция заполнения буфера  // говнокодик
{
  for (var x=0; x<buf.length; x++) { buf[x] = z;  }
}
//-----------------------------------------------------------------------------
function MyGeneratorSin( ampl,frq,pnts,dg ) // конструктор класса
{
  this.Cnt  = 0;        // номер текущей точки

  this.Ampl = ampl;     // амплитуда
  this.Frq  = frq;      // частота
  this.Pnts = pnts;     // частота дискретизации (точек в секунду)

  this.Buf  = new Float32Array(dg);

  this.GetPoint = function()
  {
    for (var i=0; i<this.Buf.length; i++)
    {
      this.Buf[i] = Math.sin( 2 * Math.PI * this.Cnt / this.Pnts * this.Frq ) * this.Ampl;
      this.Cnt++;
    }
  
    return this.Buf;
  }
}
//-----------------------------------------------------------------------------
