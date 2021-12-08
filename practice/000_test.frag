#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

void main() {
  
  vec2 r = u_resolution;
  float t = u_time;
  
  // vec2 position = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
  
  // float l = 0.1 / length(position);
  
  // vec3 color = vec3(l);
  
  // lesson1 ----------------------------------------------
  // float a = gl_FragCoord.y / 512.0; //X座標が0-1の範囲で返す
  // vec3 color = vec3(a);
  
  // lesson2 ----------------------------------------------
  // float t = u_time;
  // float r = abs(sin(t));
  // float g = abs(cos(t));
  // float b = (r + g) / 2.0;
  
  // lesson3 ----------------------------------------------
  
  //本来の座標左下が原点
  // vec2 pos = gl_FragCoord.xy / 512.0;
  
  vec2 pos = (gl_FragCoord.xy * 2.0 - r) / min(r.x, r.y); //座標を-1から1に正規化している。minはスクリーンの正方形補正
  // pos.x += 1.0;
  // pos += vec2(cos(t), sin(t)) * 0.5;
  float l = 0.1 / length(pos); //length 原点からの距離で大きくなる
  // float l = 0.1 * abs(sin(t)) / length(pos);
  vec3 color = vec3(l, l, l);
  
  // lesson 4 ---------------------------------------------
  // vec2 pos = (gl_FragCoord.xy * 2.0 - r) / min(r.x, r.y); //座標を-1から1に正規化している。minはスクリーンの正方形補正
  
  // vec3 color = vec3(0.0);
  
  // for(float i = 0.0; i < 5.0; i ++ ) {
    //   float j = i + 1.0;
    //   vec2 q = pos + vec2(cos(t * j), sin(t * j)) * 0.5;
    
    //   color += 0.05 / length(q);
    
    // color.r += 0.05 / length(q);
    // color.g += 0.02 / length(q);
    // color.b += 0.5 / length(q);
  // }
  
  gl_FragColor = vec4(color, 1.0);
}
