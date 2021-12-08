#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;

vec3 palette(in float time, in vec3 colorA, in vec3 colorB, in vec3 colorC, in vec3 colorD) {
  return colorA + colorB * cos(6.28318 * (colorC * time + colorD));
}

void main() {
  vec2 position = gl_FragCoord.xy / u_resolution;
  
  vec3 blue = vec3(0.184, 0.788, 0.902);
  vec3 green = vec3(0.651, 0.851, 0.294);
  vec3 purple = vec3(0.714, 0.357, 0.945);
  vec3 white = vec3(1.0, 1.0, 1.0);
  
  float time = u_time * 0.1;
  vec2 c1 = vec2(sin(time) * 0.2, cos(u_time) * 0.07);
  vec2 c2 = vec2(sin(time * 0.7) * 0.9, cos(u_time * 0.65) * 0.6);
  
  float d1 = length(position - c1) * - 0.8;
  vec3 col1 = palette(d1 + time, blue, green , purple , white);
  
  float d2 = length(position - c2);
  vec3 col2 = palette(d2 + time, green, blue, purple, white);
  
  // vec3 color = vec3((col1 + col2) / 2.0));
  gl_FragColor = vec4((col1 + col2) / 2.0 , 1.0);
}
