#ifdef GL_ES
precision mediump float;
#endif

void main(){
  vec3 color=vec3(.3,.5,.3);
  gl_FragColor=vec4(color,1.);
}
