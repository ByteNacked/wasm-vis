//-----------------------------------------------------------------------------
"use strict"
//-----------------------------------------------------------------------------
function getFragmentShader()
{
  var ans=`
  // фрагментные шейдеры не имеют точности по умолчанию, поэтому нам необходимо её
    // указать. mediump подойдёт для большинства случаев. Он означает "средняя точность"
    precision mediump float;
    uniform vec4 u_color;

    void main(void) 
    {
      // gl_FragColor - специальная переменная фрагментного шейдера.
      // Она отвечает за установку цвета.
      gl_FragColor = u_color; //vec4(1, 0, 0.5, 1);
    }
  `;

  return ans;
}

function getVertexShader()
{
  var ans = `
    attribute vec2 a_position;
    uniform vec2 u_resolution;
    uniform vec2 u_shift;
    uniform vec2 u_xmod;

    // all shaders have a main function
    void main() 
    {
      vec2 Pos = a_position + u_shift; 
      
      if(u_xmod.x != 0.0 )
      {
        Pos.x = mod(Pos.x,u_xmod.x);
      };
      

      vec2 zeroToOne = Pos / u_resolution; // преобразуем положение в пикселях к диапазону от 0.0 до 1.0
   
      // преобразуем из 0->1 в 0->2
      vec2 zeroToTwo = zeroToOne * 2.0;
   
      // преобразуем из 0->2 в -1->+1 (пространство отсечения)
      vec2 clipSpace = zeroToTwo - 1.0;
      vec2 clipSpaceN = clipSpace * vec2(1, -1); // переворачиваем систему коооординат (0,0) в левом верхнем углу
 
      gl_Position = vec4(clipSpaceN, 0, 1);  
    }`;
    return ans
}